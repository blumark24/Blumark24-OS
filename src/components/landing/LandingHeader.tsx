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
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-7xl rounded-2xl border border-cyan-300/20 bg-[linear-gradient(140deg,rgba(8,14,34,0.82),rgba(8,14,34,0.58))] backdrop-blur-3xl shadow-[0_18px_80px_-30px_rgba(34,211,238,0.45),0_10px_40px_-24px_rgba(0,0,0,0.95)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:border before:border-white/[0.08] before:[mask-image:linear-gradient(to_bottom,white,transparent)] relative overflow-hidden">
        <div className="flex h-[72px] items-center justify-between px-4 sm:px-7">
          <Link href="/" aria-label="Blumark24 OS">
            <OfficialBlumarkLogo className="w-[138px] sm:w-[160px]" />
          </Link>

          <nav className="hidden items-center gap-2.5 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="rounded-xl px-3.5 py-2 text-sm text-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link href="/auth" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4.5 py-2.5 text-sm text-white shadow-[0_8px_24px_-14px_rgba(34,211,238,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/20">
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
