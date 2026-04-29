import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 删除试衣历史记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token) as JWTPayload | null;
    if (!payload) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { id } = await params;

    // 检查记录是否存在且属于当前用户
    const history = await prisma.tryOnHistory.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!history) {
      return NextResponse.json(
        { error: '记录不存在或无权删除' },
        { status: 404 }
      );
    }

    // 删除记录
    await prisma.tryOnHistory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });

  } catch (error) {
    console.error('删除试衣历史失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
