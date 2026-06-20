import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getClientIdentifier, requireAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';

// 阿里云 DashScope API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

function isBase64DataUrl(value: string): boolean {
  return /^data:image\/[\w.+-]+;base64,/i.test(value);
}

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function dataUrlToBuffer(value: string): Buffer {
  const match = value.match(/^data:image\/[\w.+-]+;base64,(.+)$/i);
  if (!match?.[1]) {
    throw new Error('图片数据无效');
  }

  return Buffer.from(match[1], 'base64');
}

function getImageMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.svg') return 'image/svg+xml';

  return 'image/jpeg';
}

async function resolveImageInput(imageInput: string): Promise<string> {
  if (isBase64DataUrl(imageInput) || isRemoteUrl(imageInput)) {
    return imageInput;
  }

  if (!imageInput.startsWith('/')) {
    return imageInput;
  }

  const publicRoot = path.join(process.cwd(), 'public');
  const requestedPath = path.resolve(publicRoot, `.${imageInput}`);

  if (!requestedPath.startsWith(publicRoot)) {
    throw new Error('本地素材路径无效');
  }

  const fileBuffer = await readFile(requestedPath);
  const mimeType = getImageMimeType(requestedPath);
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
}

async function resolveImageBuffer(imageInput: string): Promise<Buffer> {
  const resolved = await resolveImageInput(imageInput);
  if (isBase64DataUrl(resolved)) {
    return dataUrlToBuffer(resolved);
  }

  if (isRemoteUrl(resolved)) {
    const response = await fetch(resolved, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('远程图片读取失败');
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error('图片格式不受支持');
}

async function createLocalDemoPreview(
  personImage: string,
  clothImage: string,
  keepClothImage?: string
): Promise<string> {
  const width = 900;
  const height = 1125;
  const personBuffer = await resolveImageBuffer(personImage);
  const selectedBuffers = await Promise.all(
    [clothImage, keepClothImage].filter((value): value is string => Boolean(value)).map(resolveImageBuffer)
  );

  const cardWidth = selectedBuffers.length > 1 ? 220 : 260;
  const cardHeight = selectedBuffers.length > 1 ? 276 : 326;
  const gap = 22;
  const cardTop = height - cardHeight - 58;
  const cardsWidth = selectedBuffers.length * cardWidth + Math.max(selectedBuffers.length - 1, 0) * gap;
  const cardLeft = width - cardsWidth - 48;

  const overlays = await Promise.all(
    selectedBuffers.map(async (buffer, index) => {
      const card = await sharp({
        create: {
          width: cardWidth,
          height: cardHeight,
          channels: 4,
          background: { r: 12, g: 12, b: 14, alpha: 0.9 },
        },
      })
        .composite([
          {
            input: await sharp(buffer)
              .resize(cardWidth - 18, cardHeight - 18, { fit: 'contain' })
              .png()
              .toBuffer(),
            left: 9,
            top: 9,
          },
        ])
        .png()
        .toBuffer();

      return {
        input: card,
        left: cardLeft + index * (cardWidth + gap),
        top: cardTop,
      };
    })
  );

  const label = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${height - 410}" width="${width}" height="410" fill="url(#fade)"/>
      <text x="48" y="${height - 92}" fill="#f5f2ed" font-size="24" font-family="Arial, sans-serif" letter-spacing="5">LOCAL DEMO PREVIEW</text>
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#050505" stop-opacity="0"/>
          <stop offset="1" stop-color="#050505" stop-opacity="0.88"/>
        </linearGradient>
      </defs>
    </svg>
  `);

  const output = await sharp(personBuffer)
    .resize(width, height, { fit: 'cover', position: 'top' })
    .composite([{ input: label, left: 0, top: 0 }, ...overlays])
    .jpeg({ quality: 88, progressive: true })
    .toBuffer();

  const generatedDirectory = path.join(process.cwd(), 'public', 'generated');
  const fileName = `demo-${randomUUID()}.jpg`;
  await mkdir(generatedDirectory, { recursive: true });
  await writeFile(path.join(generatedDirectory, fileName), output);

  return `/generated/${fileName}`;
}

/**
 * 处理并压缩图片，确保符合阿里云 API 要求
 * 要求：最长边 < 4096px，最短边 > 150px，文件大小 5KB-5MB
 */
async function processImage(imageInput: string): Promise<string> {
  const resolvedImage = await resolveImageInput(imageInput);
  if (!isBase64DataUrl(resolvedImage)) {
    return resolvedImage;
  }

  try {
    // 移除 base64 前缀
    const base64Data = resolvedImage.replace(/^data:image\/[\w.+-]+;base64,/i, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 检查文件大小
    const fileSizeKB = buffer.length / 1024;
    console.log(`图片原始大小: ${fileSizeKB.toFixed(2)} KB`);

    // 使用 sharp 处理图片
    let image = sharp(buffer);

    // 获取图片元数据
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    console.log(`图片原始尺寸: ${width}x${height}`);

    // 计算新的尺寸（保持比例）
    let newWidth = width;
    let newHeight = height;
    const maxSize = 2048; // 设置为 2048px 以确保安全（小于 4096）
    const minSize = 200;  // 设置为 200px 以确保安全（大于 150）

    // 如果最长边超过限制，进行缩放
    const maxDimension = Math.max(width, height);
    if (maxDimension > maxSize) {
      const ratio = maxSize / maxDimension;
      newWidth = Math.floor(width * ratio);
      newHeight = Math.floor(height * ratio);
    }

    // 如果最短边小于限制，进行放大
    const minDimension = Math.min(width, height);
    if (minDimension < minSize) {
      const ratio = minSize / minDimension;
      newWidth = Math.floor(width * ratio);
      newHeight = Math.floor(height * ratio);
    }

    // 调整尺寸
    image = image.resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: false,
    });

    // 转换为 JPEG 格式并压缩质量
    let outputBuffer = await image
      .jpeg({
        quality: 90,
        progressive: true,
      })
      .toBuffer();

    // 如果文件仍然太大（超过 4MB），进一步压缩
    if (outputBuffer.length > 4 * 1024 * 1024) {
      outputBuffer = await image
        .jpeg({
          quality: 75,
          progressive: true,
        })
        .toBuffer();
    }

    // 如果还是太大，降低分辨率再试
    if (outputBuffer.length > 4 * 1024 * 1024) {
      const ratio = Math.sqrt((4 * 1024 * 1024) / outputBuffer.length) * 0.9;
      newWidth = Math.floor(newWidth * ratio);
      newHeight = Math.floor(newHeight * ratio);

      outputBuffer = await sharp(buffer)
        .resize(newWidth, newHeight, { fit: 'inside' })
        .jpeg({ quality: 75 })
        .toBuffer();
    }

    console.log(`图片处理后大小: ${(outputBuffer.length / 1024).toFixed(2)} KB`);

    // 返回 base64 格式的图片
    return `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
  } catch (error) {
    console.error('图片处理失败，使用解析后的原图:', error);
    return resolvedImage;
  }
}

interface TryOnRequest {
  personImage: string;  // 用户照片（Base64 或 URL）
  clothImage: string;   // 衣服照片（Base64 或 URL）
  clothType: 'upper' | 'lower' | 'full';  // 衣服类型：上装、下装、连衣裙
  keepClothImage?: string;  // 要保留的衣服图片（用于叠加模式）
}

interface DashScopeImageSynthesisInput {
  person_image_url: string;
  top_garment_url?: string;
  bottom_garment_url?: string;
}

interface DashScopeImageSynthesisParameters {
  resolution: number;
}

interface DashScopeImageSynthesisRequest {
  model: 'aitryon';
  input: DashScopeImageSynthesisInput;
  parameters: DashScopeImageSynthesisParameters;
}

interface DashScopeTaskOutput {
  task_id?: string;
}

interface DashScopeTaskResponse {
  output?: DashScopeTaskOutput;
}

interface DashScopeErrorResponse {
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTryOnClothType(value: unknown): value is TryOnRequest['clothType'] {
  return value === 'upper' || value === 'lower' || value === 'full';
}

function parseTryOnRequest(rawBody: unknown): TryOnRequest | null {
  if (!isRecord(rawBody)) {
    return null;
  }

  const { personImage, clothImage, clothType, keepClothImage } = rawBody;
  if (
    typeof personImage !== 'string' ||
    typeof clothImage !== 'string' ||
    !isTryOnClothType(clothType)
  ) {
    return null;
  }

  if (keepClothImage !== undefined && typeof keepClothImage !== 'string') {
    return null;
  }

  return {
    personImage,
    clothImage,
    clothType,
    keepClothImage,
  };
}

function getDashScopeTaskId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const { output } = value;
  if (!isRecord(output) || typeof output.task_id !== 'string') {
    return null;
  }

  return output.task_id;
}

/**
 * 调用阿里云 AI 试衣 API
 * 文档：https://help.aliyun.com/zh/model-studio/outfitanyone-api
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit({
      key: `ai-tryon:create:${auth.payload.userId}:${clientId}`,
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'AI 试衣请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const rawBody: unknown = await request.json();
    const body = parseTryOnRequest(rawBody);
    if (!body) {
      return NextResponse.json(
        { error: '请上传用户照片和衣服照片' },
        { status: 400 }
      );
    }

    const { personImage, clothImage, clothType, keepClothImage } = body;

    // 验证必填参数
    if (!personImage || !clothImage) {
      return NextResponse.json(
        { error: '请上传用户照片和衣服照片' },
        { status: 400 }
      );
    }

    if (!DASHSCOPE_API_KEY && process.env.NODE_ENV !== 'production') {
      const resultUrl = await createLocalDemoPreview(personImage, clothImage, keepClothImage);
      return NextResponse.json({
        success: true,
        status: 'completed',
        resultUrl,
        demoMode: true,
        message: '未配置 DashScope，已生成本地演示搭配板',
      });
    }

    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: '未配置阿里云 API Key，请在服务端设置 DASHSCOPE_API_KEY' },
        { status: 503 }
      );
    }

    console.log('正在处理图片...', { clothType });

    // 处理并压缩图片，确保符合阿里云 API 要求
    const processedPersonImage = await processImage(personImage);
    const processedClothImage = await processImage(clothImage);
    const processedKeepClothImage = keepClothImage ? await processImage(keepClothImage) : null;

    console.log('图片处理完成，调用阿里云 AI 试衣 API...');

    // 构建请求体（使用处理后的图片）
    const requestBody: DashScopeImageSynthesisRequest = {
      model: 'aitryon',  // 使用标准版模型
      input: {
        person_image_url: processedPersonImage,
      },
      parameters: {
        resolution: -1,        // 自动选择最佳分辨率
      }
    };

    // 根据衣服类型设置参数
    if (clothType === 'upper' || clothType === 'full') {
      requestBody.input.top_garment_url = processedClothImage;
      // 如果传入了要保留的衣服图片（叠加模式），则作为 bottom_garment_url 传入
      if (processedKeepClothImage) {
        requestBody.input.bottom_garment_url = processedKeepClothImage;
      }
    }
    if (clothType === 'lower') {
      requestBody.input.bottom_garment_url = processedClothImage;
      // 如果传入了要保留的衣服图片（叠加模式），则作为 top_garment_url 传入
      if (processedKeepClothImage) {
        requestBody.input.top_garment_url = processedKeepClothImage;
      }
    }

    // 调用阿里云 API
    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/image2image/image-synthesis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'X-DashScope-Async': 'enable',  // 启用异步处理
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch((): DashScopeErrorResponse => ({})) as DashScopeErrorResponse;
      console.error('阿里云 API 错误:', errorData);

      if (process.env.NODE_ENV !== 'production') {
        const resultUrl = await createLocalDemoPreview(personImage, clothImage, keepClothImage);
        return NextResponse.json({
          success: true,
          status: 'completed',
          resultUrl,
          demoMode: true,
          message: 'DashScope 当前不可用，已生成本地演示搭配板',
        });
      }

      return NextResponse.json(
        { error: `AI 试衣服务暂时不可用: ${errorData.message || response.statusText}` },
        { status: 503 }
      );
    }

    const data = await response.json() as DashScopeTaskResponse;
    console.log('阿里云 API 响应:', data);

    const taskId = getDashScopeTaskId(data);
    if (!taskId) {
      return NextResponse.json(
        { error: 'AI 试衣服务返回了无效任务信息' },
        { status: 500 }
      );
    }

    // 返回任务 ID，前端需要轮询查询结果
    return NextResponse.json({
      success: true,
      taskId,
      message: 'AI 试衣任务已创建，正在处理中...',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    console.error('AI 试衣 API 错误:', error);

    // 根据错误类型返回不同的错误信息
    if (message.includes('heif') || message.includes('HEIF')) {
      return NextResponse.json(
        { error: '不支持 HEIF/HEIC 格式的图片，请转换为 JPG 或 PNG 后重试' },
        { status: 400 }
      );
    }

    if (message.includes('VipsJpeg')) {
      return NextResponse.json(
        { error: '图片格式有误，请尝试使用其他 JPG/PNG 图片' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
