import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 保存 AI 试衣历史记录
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      personImageUrl,
      clothImageUrl,
      keepClothImageUrl,
      resultImageUrl,
      clothType,
      tryOnMode,
    } = body;

    // 验证必填参数
    if (!personImageUrl || !clothImageUrl || !resultImageUrl || !clothType || !tryOnMode) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 保存试衣历史记录
    const history = await prisma.tryOnHistory.create({
      data: {
        userId,
        personImageUrl,
        clothImageUrl,
        keepClothImageUrl: keepClothImageUrl || null,
        resultImageUrl,
        clothType,
        tryOnMode,
      },
    });

    return NextResponse.json({
      success: true,
      history,
      message: '试衣历史保存成功',
    });

  } catch (error) {
    console.error('保存试衣历史失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 获取用户的试衣历史记录
 */
export async function GET(request: NextRequest) {
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

    // 获取 URL 参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 查询历史记录
    const [history, total] = await Promise.all([
      prisma.tryOnHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.tryOnHistory.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      history,
      total,
      message: '获取试衣历史成功',
    });

  } catch (error) {
    console.error('获取试衣历史失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
