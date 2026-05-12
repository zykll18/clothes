import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/jwt';

export type AuthenticatedRequest =
  | { ok: true; payload: JWTPayload }
  | { ok: false; response: NextResponse };

export function requireAuth(request: NextRequest): AuthenticatedRequest {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    payload,
  };
}

export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',');
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}
