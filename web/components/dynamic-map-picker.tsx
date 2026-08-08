"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-xl border border-ink-200 bg-ink-50 flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-ink-400" />
    </div>
  ),
});

export default MapPicker;
