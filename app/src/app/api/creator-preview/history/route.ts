import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { DIRECTION_TONES, isCreatorPreviewSavePayload } from '@/lib/creator-preview';

function parseLimit(request: NextRequest): number {
  const rawLimit = new URL(request.url).searchParams.get('limit');
  const parsed = Number(rawLimit ?? '12');

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 12;
  }

  return Math.min(Math.floor(parsed), 24);
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const rawBody: unknown = await request.json();
    if (!isCreatorPreviewSavePayload(rawBody)) {
      return NextResponse.json(
        { error: '内容预演保存请求无效' },
        { status: 400 }
      );
    }

    const session = await prisma.creatorPreviewSession.create({
      data: {
        userId: auth.payload.userId,
        personImageUrl: rawBody.personImageUrl,
        sourceImageUrl: rawBody.sourceImageUrl,
        primaryColor: rawBody.primaryColor,
        directionTags: rawBody.directionTags,
        selectedOuterwearId: rawBody.slotSelections.outerwear ?? null,
        selectedInnerwearId: rawBody.slotSelections.innerwear ?? null,
        selectedPantsId: rawBody.slotSelections.pants ?? null,
        selectedAccessoryId: rawBody.slotSelections.accessory ?? null,
        selectedShoesId: rawBody.slotSelections.shoes ?? null,
        selectedDirection: rawBody.selectedDirection,
        variants: {
          create: rawBody.variants.map((variant) => ({
            direction: variant.direction,
            sortOrder: variant.sortOrder,
            resultUrl: variant.resultUrl,
            presentationTone: variant.presentationTone || DIRECTION_TONES[variant.direction],
            selected: variant.direction === rawBody.selectedDirection,
          })),
        },
      },
      include: {
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('保存内容预演历史失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const limit = parseLimit(request);

    const [sessions, total] = await Promise.all([
      prisma.creatorPreviewSession.findMany({
        where: { userId: auth.payload.userId },
        include: {
          variants: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.creatorPreviewSession.count({
        where: { userId: auth.payload.userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      total,
    });
  } catch (error) {
    console.error('获取内容预演历史失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
