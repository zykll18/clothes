import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const navItems = [
  { href: "#story", label: "故事" },
  { href: "#process", label: "体验" },
  { href: "#capabilities", label: "能力" },
  { href: "/auth/login", label: "登录" },
];

export default function HomeNavbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
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
            开始试穿
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </nav>

        <div className="h-12 w-12 md:hidden" />
      </div>
    </header>
  );
}
