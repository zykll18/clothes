import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// 阿里云 DashScope API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

/**
 * 处理并压缩图片，确保符合阿里云 API 要求
 * 要求：最长边 < 4096px，最短边 > 150px，文件大小 5KB-5MB
 */
async function processImage(base64Image: string): Promise<string> {
  try {
    // 移除 base64 前缀
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
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
    console.error('图片处理失败，使用原图:', error);
    // 如果处理失败，返回原图
    return base64Image;
  }
}

interface TryOnRequest {
  personImage: string;  // 用户照片（Base64 或 URL）
  clothImage: string;   // 衣服照片（Base64 或 URL）
  clothType: 'upper' | 'lower' | 'full';  // 衣服类型：上装、下装、连衣裙
  keepClothImage?: string;  // 要保留的衣服图片（用于叠加模式）
}

/**
 * 调用阿里云 AI 试衣 API
 * 文档：https://help.aliyun.com/zh/model-studio/outfitanyone-api
 */
export async function POST(request: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: '未配置阿里云 API Key，请在 .env 文件中设置 DASHSCOPE_API_KEY' },
        { status: 500 }
      );
    }

    const body: TryOnRequest = await request.json();
    const { personImage, clothImage, clothType, keepClothImage } = body;

    // 验证必填参数
    if (!personImage || !clothImage) {
      return NextResponse.json(
        { error: '请上传用户照片和衣服照片' },
        { status: 400 }
      );
    }

    console.log('正在处理图片...', { clothType });

    // 处理并压缩图片，确保符合阿里云 API 要求
    const processedPersonImage = await processImage(personImage);
    const processedClothImage = await processImage(clothImage);
    const processedKeepClothImage = keepClothImage ? await processImage(keepClothImage) : null;

    console.log('图片处理完成，调用阿里云 AI 试衣 API...');

    // 构建请求体（使用处理后的图片）
    const requestBody: any = {
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
      const errorData = await response.json().catch(() => ({}));
      console.error('阿里云 API 错误:', errorData);
      return NextResponse.json(
        { error: `AI 试衣服务调用失败: ${errorData.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('阿里云 API 响应:', data);

    // 返回任务 ID，前端需要轮询查询结果
    return NextResponse.json({
      success: true,
      taskId: data.output?.task_id,
      message: 'AI 试衣任务已创建，正在处理中...',
    });

  } catch (error: any) {
    console.error('AI 试衣 API 错误:', error);

    // 根据错误类型返回不同的错误信息
    if (error.message?.includes('heif') || error.message?.includes('HEIF')) {
      return NextResponse.json(
        { error: '不支持 HEIF/HEIC 格式的图片，请转换为 JPG 或 PNG 后重试' },
        { status: 400 }
      );
    }

    if (error.message?.includes('VipsJpeg')) {
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
