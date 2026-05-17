"use client";

import Link from "next/link";
import { Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

const navItems = [
  { href: "#features", label: "المزايا" },
  { href: "#modules", label: "الوحدات" },
  { href: "#how-it-works", label: "كيف يعمل" },
  { href: "#demo", label: "الديمو" },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[rgba(5,8,22,0.68)] backdrop-blur-2xl shadow-[0_12px_40px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Blumark24 OS">
            <OfficialBlumarkLogo className="w-[138px] sm:w-[160px]" />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link href="/auth" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-white hover:bg-cyan-300/20">
              <LogIn size={16} /> تسجيل دخول المنشآت
            </Link>
          </div>

          <button onClick={() => setOpen((v) => !v)} className="md:hidden rounded-xl border border-white/15 p-2 text-white" aria-label="القائمة">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {open && (
          <div className="space-y-2 border-t border-white/10 px-4 py-4 md:hidden">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5" onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link href="/auth" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-cyan-400/20 px-3 py-2 text-sm text-white">تسجيل دخول المنشآت</Link>
          </div>
        )}
      </div>
    </header>
  );
}
