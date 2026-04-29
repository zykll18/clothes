import { NextRequest, NextResponse } from 'next/server';

// 阿里云 DashScope API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

/**
 * 查询 AI 试衣任务状态
 */
export async function GET(request: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: '未配置阿里云 API Key' },
        { status: 500 }
      );
    }

    // 从 URL 获取任务 ID
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: '缺少任务 ID' },
        { status: 400 }
      );
    }

    console.log('查询任务状态:', taskId);

    // 调用阿里云 API 查询任务状态
    const response = await fetch(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('查询任务状态失败:', errorData);
      return NextResponse.json(
        { error: `查询失败: ${errorData.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('任务状态:', data);

    // 解析任务状态
    const taskStatus = data.output?.task_status;

    if (taskStatus === 'SUCCEEDED') {
      // 任务成功，返回结果图片 URL
      return NextResponse.json({
        success: true,
        status: 'completed',
        resultUrl: data.output?.image_url,
        message: 'AI 试衣完成！',
      });
    } else if (taskStatus === 'FAILED') {
      // 任务失败
      return NextResponse.json({
        success: false,
        status: 'failed',
        message: data.output?.message || 'AI 试衣失败，请重试',
      });
    } else {
      // 任务仍在处理中（PENDING 或 RUNNING）
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'AI 正在试衣中，请稍候...',
      });
    }

  } catch (error) {
    console.error('查询任务状态错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
