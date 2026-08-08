"use client";

import { useState } from "react";

export default function Avatar({
  initials,
  src,
  avatarUrl,
  hue = 260,
  size = "md",
  className = "",
}: {
  initials: string;
  src?: string;
  avatarUrl?: string;
  hue?: number | string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const imageSource = src || avatarUrl;

  const sizeClasses = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-16 text-lg",
    xl: "size-24 text-xl",
    "2xl": "size-30 text-2xl"
  }[size];

  const numericHue = typeof hue === "number" ? hue : parseInt(hue as string, 10) || 260;

  if (imageSource && !imageError) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${sizeClasses} ${className}`}
      >
        <img
          src={imageSource}
          alt={initials || "User avatar"}
          onError={() => setImageError(true)}
          className="size-full rounded-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `oklch(0.55 0.16 ${numericHue})`,
      }}
    >
      {initials}
    </span>
  );
}
