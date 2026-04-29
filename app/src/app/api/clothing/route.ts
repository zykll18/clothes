import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

type ClothingRequestCategory = 'TOP' | 'BOTTOM' | 'DRESS' | 'OUTERWEAR' | 'SHOES' | 'ACCESSORY';
type ClothingRequestClothType = 'upper' | 'lower' | 'full';

interface CreateClothingRequest {
  name: string;
  category?: ClothingRequestCategory;
  clothType: ClothingRequestClothType;
  imageUrl: string;
  color?: string;
  brand?: string;
}

const CLOTHING_REQUEST_CATEGORIES: readonly ClothingRequestCategory[] = [
  'TOP',
  'BOTTOM',
  'DRESS',
  'OUTERWEAR',
  'SHOES',
  'ACCESSORY',
];

const CLOTHING_REQUEST_CLOTH_TYPES: readonly ClothingRequestClothType[] = [
  'upper',
  'lower',
  'full',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isClothingRequestCategory(value: unknown): value is ClothingRequestCategory {
  return typeof value === 'string' && CLOTHING_REQUEST_CATEGORIES.includes(value as ClothingRequestCategory);
}

function isClothingRequestClothType(value: unknown): value is ClothingRequestClothType {
  return typeof value === 'string' && CLOTHING_REQUEST_CLOTH_TYPES.includes(value as ClothingRequestClothType);
}

function parseCreateClothingRequest(rawBody: unknown): CreateClothingRequest | null {
  if (!isRecord(rawBody)) {
    return null;
  }

  const { name, category, clothType, imageUrl, color, brand } = rawBody;
  if (typeof name !== 'string' || typeof imageUrl !== 'string' || !isClothingRequestClothType(clothType)) {
    return null;
  }

  if (category !== undefined && !isClothingRequestCategory(category)) {
    return null;
  }

  if (color !== undefined && typeof color !== 'string') {
    return null;
  }

  if (brand !== undefined && typeof brand !== 'string') {
    return null;
  }

  return {
    name,
    category,
    clothType,
    imageUrl,
    color,
    brand,
  };
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

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const rawClothType = searchParams.get('clothType');

    const where: Prisma.ClothingItemWhereInput = { userId };
    if (rawClothType !== null) {
      if (!isClothingRequestClothType(rawClothType)) {
        return NextResponse.json(
          { error: '无效的衣服类型' },
          { status: 400 }
        );
      }

      where.clothType = rawClothType;
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

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const rawBody: unknown = await request.json();
    const body = parseCreateClothingRequest(rawBody);
    if (!body) {
      return NextResponse.json(
        { error: '缺少必要信息' },
        { status: 400 }
      );
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('添加衣服失败:', error);
    console.error('Error details:', message);
    return NextResponse.json(
      { error: '服务器错误: ' + message },
      { status: 500 }
    );
  }
}
