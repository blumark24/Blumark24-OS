import Image from "next/image";

interface OfficialBlumarkLogoProps {
  className?: string;
}

export default function OfficialBlumarkLogo({ className = "" }: OfficialBlumarkLogoProps) {
  return (
    <Image
      src="/brand/blumark24-logo-transparent.png"
      width={240}
      height={96}
      alt="Blumark24 Marketing Agency"
      className={`object-contain object-center h-auto max-h-full w-auto ${className}`}
      sizes="(max-width: 768px) 128px, 160px"
      priority
      unoptimized
    />
  );
}
