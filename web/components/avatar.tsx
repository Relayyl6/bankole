export default function Avatar({
  initials,
  hue,
  size = "md",
}: {
  initials: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-16 text-lg",
  }[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizeClasses}`}
      style={{
        backgroundColor: `oklch(0.55 0.16 ${hue})`,
      }}
    >
      {initials}
    </span>
  );
}
