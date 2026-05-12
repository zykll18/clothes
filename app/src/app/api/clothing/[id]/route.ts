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

    const userId = auth.payload.userId;
    const { id } = await params;

    // 验证衣服是否属于当前用户
    const clothingItem = await prisma.clothingItem.findFirst({
      where: { id, userId },
    });

    if (!clothingItem) {
      return NextResponse.json(
        { error: '衣服不存在' },
        { status: 404 }
      );
    }

    await prisma.clothingItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '衣服删除成功',
    });
  } catch (error) {
    console.error('删除衣服失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
