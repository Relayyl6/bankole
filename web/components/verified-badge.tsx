import { ShieldCheck } from "lucide-react";

export default function VerifiedBadge({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const isSmall = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 font-medium ${
        isSmall ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
      }`}
    >
      <ShieldCheck className={isSmall ? "size-3" : "size-3.5"} strokeWidth={2.5} />
      Verified
    </span>
  );
}
