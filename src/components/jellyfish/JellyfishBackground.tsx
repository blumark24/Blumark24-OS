"use client";

export default function JellyfishBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Ambient glow circles */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-400/5 blur-3xl jellyfish-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl jellyfish-pulse" style={{ animationDelay: "2s" }} />

      {/* Large jellyfish */}
      <svg
        className="absolute top-8 right-12 w-48 h-56 jellyfish-anim opacity-70"
        viewBox="0 0 200 240"
        fill="none"
      >
        <defs>
          <radialGradient id="jelly1" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#1e6fd9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="jellyInner1" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <filter id="glow1">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Bell */}
        <ellipse cx="100" cy="80" rx="72" ry="68" fill="url(#jelly1)" filter="url(#glow1)" />
        <ellipse cx="100" cy="70" rx="55" ry="50" fill="url(#jellyInner1)" />
        {/* Rim */}
        <path d="M28,80 Q40,100 55,95 Q65,110 80,100 Q90,115 100,108 Q110,115 120,100 Q135,110 145,95 Q160,100 172,80" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
        {/* Tentacles */}
        <path d="M55,100 Q50,130 58,160 Q52,185 60,210" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.4" fill="none" strokeLinecap="round"/>
        <path d="M72,108 Q68,140 74,168 Q70,192 76,220" stroke="#1e6fd9" strokeWidth="1" strokeOpacity="0.35" fill="none" strokeLinecap="round"/>
        <path d="M90,112 Q88,145 92,175 Q89,200 94,230" stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.5" fill="none" strokeLinecap="round"/>
        <path d="M108,112 Q110,145 106,175 Q109,200 104,230" stroke="#1e6fd9" strokeWidth="1" strokeOpacity="0.35" fill="none" strokeLinecap="round"/>
        <path d="M125,108 Q130,140 124,168 Q128,192 122,220" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.4" fill="none" strokeLinecap="round"/>
        <path d="M143,100 Q148,130 140,160 Q146,185 138,210" stroke="#1e6fd9" strokeWidth="1" strokeOpacity="0.3" fill="none" strokeLinecap="round"/>
        {/* Inner details */}
        <ellipse cx="100" cy="55" rx="20" ry="15" fill="#22d3ee" fillOpacity="0.1"/>
        <ellipse cx="78" cy="65" rx="8" ry="10" fill="#1e6fd9" fillOpacity="0.15"/>
        <ellipse cx="122" cy="65" rx="8" ry="10" fill="#1e6fd9" fillOpacity="0.15"/>
      </svg>

      {/* Medium jellyfish */}
      <svg
        className="absolute bottom-16 right-24 w-32 h-40 jellyfish-anim-2 opacity-50"
        viewBox="0 0 200 240"
        fill="none"
      >
        <defs>
          <radialGradient id="jelly2" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#1e6fd9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="75" rx="65" ry="60" fill="url(#jelly2)" />
        <path d="M35,75 Q50,95 65,88 Q78,102 92,94 Q100,106 108,94 Q122,102 135,88 Q150,95 165,75" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.4" fill="none"/>
        <path d="M60,95 Q55,125 62,152" stroke="#a855f7" strokeWidth="0.8" strokeOpacity="0.35" fill="none" strokeLinecap="round"/>
        <path d="M80,104 Q76,134 82,162" stroke="#1e6fd9" strokeWidth="0.8" strokeOpacity="0.3" fill="none" strokeLinecap="round"/>
        <path d="M100,108 Q98,138 102,166" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" fill="none" strokeLinecap="round"/>
        <path d="M120,104 Q124,134 118,162" stroke="#1e6fd9" strokeWidth="0.8" strokeOpacity="0.3" fill="none" strokeLinecap="round"/>
        <path d="M140,95 Q145,125 138,152" stroke="#a855f7" strokeWidth="0.8" strokeOpacity="0.35" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Small jellyfish */}
      <svg
        className="absolute top-1/2 left-8 w-20 h-28 jellyfish-anim-3 opacity-40"
        viewBox="0 0 200 240"
        fill="none"
      >
        <defs>
          <radialGradient id="jelly3" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff7a3d" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="70" rx="60" ry="55" fill="url(#jelly3)" />
        <path d="M40,70 Q55,88 70,82 Q85,96 100,88 Q115,96 130,82 Q145,88 160,70" stroke="#ff7a3d" strokeWidth="1" strokeOpacity="0.35" fill="none"/>
        <path d="M65,88 Q60,118 67,145" stroke="#ff7a3d" strokeWidth="0.7" strokeOpacity="0.3" fill="none" strokeLinecap="round"/>
        <path d="M85,96 Q82,126 88,154" stroke="#22d3ee" strokeWidth="0.7" strokeOpacity="0.25" fill="none" strokeLinecap="round"/>
        <path d="M100,100 Q99,130 101,158" stroke="#ff7a3d" strokeWidth="0.9" strokeOpacity="0.35" fill="none" strokeLinecap="round"/>
        <path d="M115,96 Q118,126 112,154" stroke="#22d3ee" strokeWidth="0.7" strokeOpacity="0.25" fill="none" strokeLinecap="round"/>
        <path d="M135,88 Q140,118 133,145" stroke="#ff7a3d" strokeWidth="0.7" strokeOpacity="0.3" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-cyan-400 jellyfish-pulse"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.4 + 0.1,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${Math.random() * 3 + 3}s`,
          }}
        />
      ))}
    </div>
  );
}
