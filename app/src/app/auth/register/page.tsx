'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail, Palette, Ruler, Sparkles, User, Weight } from 'lucide-react';
import SharedFlowerBackground from '@/components/shared/SharedFlowerBackground';
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

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

      router.push('/tryon');
    } catch {
      setApiError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lux-page relative min-h-screen overflow-hidden">
      <SharedFlowerBackground mode="hero" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,6,0.46),rgba(4,4,6,0.74)_34%,rgba(4,4,6,0.94))]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="lux-stage-frame lux-noise relative w-full max-w-[32rem] overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,177,106,0.12),transparent_34%)]" />

            <div className="relative">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/68 transition hover:text-white">
                <span className="font-heading text-xl italic leading-none">a</span>
                返回首页
              </Link>

              <div className="mt-8">
                <p className="lux-kicker text-[11px]">Register</p>
                <h2 className="mt-3 font-heading text-[2.35rem] italic leading-[0.98] text-white">创建创作者账号</h2>
              </div>

              {apiError ? (
                <div className="mt-6 rounded-[1.35rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[rgba(255,232,214,0.9)]">
                  {apiError}
                </div>
              ) : null}

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-white/78">邮箱</label>
                  <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <Mail className="h-4 w-4 text-white/42" />
                    <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" placeholder="you@example.com" />
                  </div>
                  {errors.email ? <p className="mt-2 text-sm text-[rgba(255,186,186,0.92)]">{errors.email}</p> : null}
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm text-white/78">密码</label>
                  <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <LockKeyhole className="h-4 w-4 text-white/42" />
                    <input id="password" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleChange} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" placeholder="至少 6 个字符" />
                  </div>
                  {errors.password ? <p className="mt-2 text-sm text-[rgba(255,186,186,0.92)]">{errors.password}</p> : null}
                </div>

                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-white/78">昵称</label>
                  <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <User className="h-4 w-4 text-white/42" />
                    <input id="name" name="name" type="text" autoComplete="name" value={formData.name} onChange={handleChange} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" placeholder="例如：Ariel Studio" />
                  </div>
                  {errors.name ? <p className="mt-2 text-sm text-[rgba(255,186,186,0.92)]">{errors.name}</p> : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="height" className="mb-2 block text-sm text-white/78">身高（选填）</label>
                    <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                      <Ruler className="h-4 w-4 text-white/42" />
                      <input id="height" name="height" type="number" min="100" max="250" value={formData.height} onChange={handleChange} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" placeholder="cm" />
                    </div>
                    {errors.height ? <p className="mt-2 text-sm text-[rgba(255,186,186,0.92)]">{errors.height}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="weight" className="mb-2 block text-sm text-white/78">体重（选填）</label>
                    <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                      <Weight className="h-4 w-4 text-white/42" />
                      <input id="weight" name="weight" type="number" min="30" max="200" value={formData.weight} onChange={handleChange} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" placeholder="kg" />
                    </div>
                    {errors.weight ? <p className="mt-2 text-sm text-[rgba(255,186,186,0.92)]">{errors.weight}</p> : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="bodyType" className="mb-2 block text-sm text-white/78">体型（选填）</label>
                  <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <Palette className="h-4 w-4 text-white/42" />
                    <select
                      id="bodyType"
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleChange}
                      className="w-full bg-transparent text-white outline-none"
                    >
                      <option value="" className="bg-[#111] text-white">选择体型</option>
                      <option value="SLIM" className="bg-[#111] text-white">瘦削</option>
                      <option value="REGULAR" className="bg-[#111] text-white">标准</option>
                      <option value="ATHLETIC" className="bg-[#111] text-white">健壮</option>
                      <option value="PLUS_SIZE" className="bg-[#111] text-white">丰满</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.16)] px-5 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] transition hover:bg-[rgba(212,177,106,0.24)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.05] disabled:text-white/42"
                >
                  {isLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {isLoading ? '创建中...' : '创建账号'}
                </button>
              </form>

              <p className="mt-6 text-sm text-white/62">
                已有账号？
                <Link href="/auth/login" className="ml-2 text-white transition hover:text-[rgba(255,245,225,0.94)]">
                  去登录
                </Link>
              </p>
            </div>
        </section>
      </div>
    </div>
  );
}
