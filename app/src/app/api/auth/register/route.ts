import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, height, weight, bodyType } = await request.json();

    // 验证必填字段
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        height: height || null,
        weight: weight || null,
        bodyType: bodyType || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        height: true,
        weight: true,
        bodyType: true,
        createdAt: true,
      },
    });

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // 设置token到cookie - 使用 response cookies API
    const response = NextResponse.json({
      success: true,
      message: '注册成功',
      user,
    });

    // 设置cookie到response
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
