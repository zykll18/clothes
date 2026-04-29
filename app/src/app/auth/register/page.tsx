'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { validateRegisterForm } from '@/lib/validations';
import { BodyType } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    height: '',
    weight: '',
    bodyType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    // Validate form
    const validationResult = validateRegisterForm({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bodyType: formData.bodyType as BodyType,
    });

    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || '注册失败，请稍后重试');
        return;
      }

      // Registration successful, redirect to login
      router.push('/auth/login?registered=true');
    } catch {
      setApiError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="text-center">
            <h2 className="text-3xl font-bold text-blue-600">穿搭预览</h2>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账户？{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="邮箱"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email ? { type: 'manual', message: errors.email } : undefined}
            />

            <Input
              label="密码"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password ? { type: 'manual', message: errors.password } : undefined}
              helperText="至少6个字符"
            />

            <Input
              label="姓名"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              error={errors.name ? { type: 'manual', message: errors.name } : undefined}
            />

            <Input
              label="身高 (cm)"
              id="height"
              name="height"
              type="number"
              min="100"
              max="250"
              value={formData.height}
              onChange={handleChange}
              error={errors.height ? { type: 'manual', message: errors.height } : undefined}
              helperText="选填"
            />

            <Input
              label="体重 (kg)"
              id="weight"
              name="weight"
              type="number"
              min="30"
              max="200"
              value={formData.weight}
              onChange={handleChange}
              error={errors.weight ? { type: 'manual', message: errors.weight } : undefined}
              helperText="选填"
            />

            <div>
              <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-1">
                体型
              </label>
              <select
                id="bodyType"
                name="bodyType"
                value={formData.bodyType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择体型（选填）</option>
                <option value="SLIM">瘦削</option>
                <option value="REGULAR">标准</option>
                <option value="ATHLETIC">健壮</option>
                <option value="PLUS_SIZE">丰满</option>
              </select>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            注册
          </Button>
        </form>
      </div>
    </div>
  );
}
