// 表单验证规则
import { RegisterFormData, LoginFormData } from '@/types';

// 邮箱验证
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 密码验证
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: '密码长度至少为6位' };
  }
  return { valid: true };
}

// 用户注册表单验证
export function validateRegisterForm(data: RegisterFormData): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = '请输入邮箱';
  } else if (!validateEmail(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (!data.password) {
    errors.password = '请输入密码';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error!;
    }
  }

  if (!data.name) {
    errors.name = '请输入姓名';
  } else if (data.name.length < 2) {
    errors.name = '姓名至少为2个字符';
  }

  if (data.height !== undefined && (data.height < 100 || data.height > 250)) {
    errors.height = '身高应在100-250cm之间';
  }

  if (data.weight !== undefined && (data.weight < 30 || data.weight > 200)) {
    errors.weight = '体重应在30-200kg之间';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 用户登录表单验证
export function validateLoginForm(data: LoginFormData): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = '请输入邮箱';
  } else if (!validateEmail(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (!data.password) {
    errors.password = '请输入密码';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 文件上传验证
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '只支持 JPG、PNG、WebP、GIF 格式的图片' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '图片大小不能超过 10MB' };
  }

  return { valid: true };
}
