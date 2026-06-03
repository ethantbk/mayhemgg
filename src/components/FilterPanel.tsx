"use client";

import { SlidersHorizontal } from "lucide-react";
import type { Mode, Role } from "@/types";
import { modeLabels } from "@/lib/utils";

const roles: Array<Role | "All"> = ["All", "Marksman", "Mage", "Bruiser", "Tank", "Enchanter", "Assassin"];
const modes: Array<Mode | "all"> = ["all", "arena", "aramMayhem"];

export function FilterPanel({
  role,
  mode,
  onRoleChange,
  onModeChange
}: {
  role: Role | "All";
  mode: Mode | "all";
  onRoleChange: (role: Role | "All") => void;
  onModeChange: (mode: Mode | "all") => void;
}) {
  return (
    <div className="premium-border rounded-lg bg-panel/[0.76] p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
        <SlidersHorizontal className="h-4 w-4 text-frost" aria-hidden="true" />
        Filters
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Role</span>
          <select
            value={role}
            onChange={(event) => onRoleChange(event.target.value as Role | "All")}
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-abyss px-3 text-sm font-semibold text-white outline-none focus:border-frost/[0.45]"
          >
            {roles.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mode</span>
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as Mode | "all")}
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-abyss px-3 text-sm font-semibold text-white outline-none focus:border-frost/[0.45]"
          >
            {modes.map((item) => (
              <option key={item} value={item}>{item === "all" ? "All Modes" : modeLabels[item]}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
