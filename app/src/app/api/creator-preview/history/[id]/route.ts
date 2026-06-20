import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    const session = await prisma.creatorPreviewSession.findFirst({
      where: {
        id,
        userId: auth.payload.userId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: '搭配预览不存在' },
        { status: 404 }
      );
    }

    await prisma.creatorPreviewSession.delete({
      where: { id: session.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除搭配预览历史失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
