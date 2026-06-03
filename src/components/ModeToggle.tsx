"use client";

import type { Mode } from "@/types";
import { modeLabels, modes } from "@/lib/utils";

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-white/10 bg-white/[0.045] p-1" role="tablist" aria-label="Mode">
      {modes.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded px-4 py-2 text-sm font-black transition ${
            mode === item ? "bg-frost text-abyss shadow-glow" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {modeLabels[item]}
        </button>
      ))}
    </div>
  );
}
