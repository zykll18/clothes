import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

interface JWTPayload {
  userId: string;
  email: string;
}

// 获取用户的所有衣服
export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const clothType = searchParams.get('clothType'); // upper 或 lower

    const where: any = { userId };
    if (clothType) {
      where.clothType = clothType;
    }

    const clothingItems = await prisma.clothingItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      items: clothingItems,
    });
  } catch (error) {
    console.error('获取衣服列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 添加新衣服
export async function POST(request: NextRequest) {
  try {
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
    const body = await request.json();
    const { name, category, clothType, imageUrl, color, brand } = body;

    if (!name || !imageUrl || !clothType) {
      return NextResponse.json(
        { error: '缺少必要信息' },
        { status: 400 }
      );
    }

    console.log('Creating clothing item with data:', { userId, name, category, clothType, color });

    const clothingItem = await prisma.clothingItem.create({
      data: {
        userId,
        name,
        category: category || 'TOP',
        clothType,
        imageUrl,
        color: color || null,
        brand: brand || null,
      },
    });

    console.log('Clothing item created:', clothingItem);

    return NextResponse.json({
      success: true,
      item: clothingItem,
      message: '衣服添加成功',
    });
  } catch (error: any) {
    console.error('添加衣服失败:', error);
    console.error('Error details:', error.message, error.code, error.meta);
    return NextResponse.json(
      { error: '服务器错误: ' + error.message },
      { status: 500 }
    );
  }
}
