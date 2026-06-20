"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const navItems = [
  { href: "#story", label: "故事" },
  { href: "#process", label: "体验" },
  { href: "#capabilities", label: "能力" },
  { href: "/auth/login", label: "登录" },
];

export default function HomeNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          aria-label="Aura 首页"
          className="lux-surface lux-outline flex h-12 w-12 items-center justify-center rounded-full text-xl text-white"
        >
          <span className="font-heading italic leading-none">a</span>
        </Link>

        <nav className="lux-surface lux-outline hidden items-center gap-1 rounded-full px-2 py-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-white/88 transition hover:bg-white/8 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/auth/register"
            className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            开始预演
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <div className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
              className={`
                lux-outline relative flex h-12 items-center overflow-hidden rounded-full border px-4 text-sm font-medium text-white
                shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition duration-300
                hover:-translate-y-0.5 hover:border-white/28 hover:bg-white/[0.08] hover:shadow-[0_12px_46px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.18)]
                ${menuOpen ? "border-white/30 bg-white/[0.11] shadow-[0_16px_60px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.2)]" : "border-white/12 bg-white/[0.03]"}
              `}
            >
              <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition duration-300 hover:opacity-100" />
              菜单
            </button>

            <button
              type="button"
              aria-label="关闭菜单背景"
              onClick={() => setMenuOpen(false)}
              className={`
                fixed inset-0 -z-10 bg-black/50 transition duration-500
                ${menuOpen ? "pointer-events-auto opacity-100 backdrop-blur-md" : "pointer-events-none opacity-0 backdrop-blur-0"}
              `}
            />

            <div
              className={`
                lux-outline absolute right-0 top-14 min-w-[12.5rem] overflow-hidden rounded-[1.6rem] border text-sm text-white
                shadow-[0_28px_100px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[32px]
                transition duration-500 ease-out
                ${menuOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-[0.96] opacity-0"}
              `}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.025))]" />
              <div className="pointer-events-none absolute -inset-10 bg-white/[0.035] blur-2xl" />
              <div className="relative flex flex-col p-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full px-4 py-3 transition duration-300 hover:bg-white/12 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/auth/register"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-full bg-white px-4 py-3 text-center font-medium text-black transition duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_12px_34px_rgba(255,255,255,0.16)]"
              >
                开始预演
              </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
