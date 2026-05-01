"use client";

import { Search, Bell, Mail, Plus, Settings } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 border-b border-[#1e3a5f]"
      style={{ background: "rgba(10,22,40,0.9)", backdropFilter: "blur(16px)" }}
    >
      {/* Left: search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
          <input
            type="text"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark pr-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="btn-primary flex items-center gap-1.5 py-2 px-3 text-sm">
          <Plus size={15} />
          <span>جديد</span>
        </button>

        <button className="relative p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all">
          <Bell size={18} />
          <span className="notif-badge">3</span>
        </button>

        <button className="relative p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all">
          <Mail size={18} />
          <span className="notif-badge" style={{ background: "#22d3ee" }}>5</span>
        </button>

        <button className="p-2 rounded-xl text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356]/50 transition-all">
          <Settings size={18} />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}>
          أم
        </div>
      </div>
    </header>
  );
}
