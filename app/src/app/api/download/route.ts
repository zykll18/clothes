import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

function getSafeFileName(value: string | null): string {
  const normalized = value?.trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  return normalized || 'outfit-preview.png';
}

function isAllowedRemoteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'aliyuncs.com' || url.hostname.endsWith('.aliyuncs.com'))
    );
  } catch {
    return false;
  }
}

function getLocalContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.svg') return 'image/svg+xml';
  return 'image/png';
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('url');
  const fileName = getSafeFileName(searchParams.get('filename'));

  if (!source) {
    return NextResponse.json({ error: '缺少下载地址' }, { status: 400 });
  }

  try {
    if (source.startsWith('/')) {
      const publicRoot = path.resolve(process.cwd(), 'public');
      const filePath = path.resolve(publicRoot, `.${source}`);

      if (!filePath.startsWith(`${publicRoot}${path.sep}`)) {
        return NextResponse.json({ error: '下载地址无效' }, { status: 400 });
      }

      const file = await readFile(filePath);
      return new NextResponse(new Uint8Array(file), {
        headers: {
          'Content-Type': getLocalContentType(filePath),
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    if (!isAllowedRemoteUrl(source)) {
      return NextResponse.json({ error: '下载地址不受支持' }, { status: 400 });
    }

    const response = await fetch(source, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: '结果图片暂时无法下载' }, { status: 502 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('下载搭配预览失败:', error);
    return NextResponse.json({ error: '下载失败，请稍后重试' }, { status: 500 });
  }
}
