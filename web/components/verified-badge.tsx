import { ShieldCheck } from "lucide-react";

export default function VerifiedBadge({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const isSmall = size === "sm";
  const isLarge = size === "lg";
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 font-medium ${
        isSmall ? "text-xs px-2 py-0.5" : isLarge ? "text-base px-3 py-1.5" : "text-sm px-2.5 py-1"
      } ${className}`}
    >
      <ShieldCheck className={isSmall ? "size-3" : isLarge ? "size-5" : "size-3.5"} strokeWidth={2.5} />
      Verified
    </span>
  );
}
