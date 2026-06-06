"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Beaker, Loader2, Plus, Swords, Zap } from "lucide-react";
import type { Champion, Mode } from "@/types";
import { chaosBuildTags, type ChaosBuildTag } from "@/lib/chaosTags";
import { modeLabels } from "@/lib/utils";

type CreateBuildState = "idle" | "submitting" | "success" | "error";

type CreateBuildResponse = {
  ok: boolean;
  data?: {
    build?: {
      slug?: string;
      id?: string;
    };
  };
  error?: string;
  details?: string[];
};

function linesToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
      {children}
    </label>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 5,
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2 w-full rounded-md border border-white/10 bg-abyss/[0.72] px-3 py-3 text-sm font-bold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-frost/50"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ChaosBuildCreateForm({
  champions
}: {
  champions: Pick<Champion, "name" | "slug">[];
}) {
  const router = useRouter();
  const [championSlug, setChampionSlug] = useState(champions[0]?.slug ?? "");
  const [mode, setMode] = useState<Mode>("arena");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<ChaosBuildTag[]>([]);
  const [itemOrder, setItemOrder] = useState("");
  const [augments, setAugments] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [matchupNotes, setMatchupNotes] = useState("");
  const [state, setState] = useState<CreateBuildState>("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const selectedChampion = useMemo(
    () => champions.find((champion) => champion.slug === championSlug),
    [championSlug, champions]
  );

  function toggleTag(tag: ChaosBuildTag) {
    setTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessages([]);

    const response = await fetch("/api/chaos-lab/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        championSlug,
        mode,
        title,
        description,
        tags,
        itemOrder: linesToList(itemOrder),
        augments: linesToList(augments),
        strengths: linesToList(strengths),
        weaknesses: linesToList(weaknesses),
        matchupNotes: linesToList(matchupNotes)
      })
    });
    const result = await response.json() as CreateBuildResponse;

    if (!response.ok || !result.ok) {
      setState("error");
      setMessages(result.details?.length ? result.details : [result.error ?? "Build submission failed."]);
      return;
    }

    setState("success");
    setMessages(["Build submitted to Chaos Lab."]);
    const slug = result.data?.build?.slug ?? result.data?.build?.id;

    if (slug) {
      router.push(`/chaos-lab/${slug}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <Swords className="h-5 w-5 text-frost" aria-hidden="true" />
          <h2 className="text-2xl font-black text-white">Build Identity</h2>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <FieldLabel htmlFor="champion">Champion</FieldLabel>
            <select
              id="champion"
              value={championSlug}
              onChange={(event) => setChampionSlug(event.target.value)}
              required
              className="mt-2 h-12 w-full rounded-md border border-white/10 bg-abyss/[0.72] px-3 text-sm font-bold text-white outline-none transition focus:border-frost/50"
            >
              {champions.map((champion) => (
                <option key={champion.slug} value={champion.slug}>
                  {champion.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Mode</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["arena", "aramMayhem"] as Mode[]).map((candidateMode) => (
                <button
                  key={candidateMode}
                  type="button"
                  onClick={() => setMode(candidateMode)}
                  className={`h-12 rounded-md border px-3 text-sm font-black transition ${mode === candidateMode ? "border-volt/35 bg-volt/[0.12] text-volt" : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-frost/25 hover:text-white"}`}
                >
                  {modeLabels[candidateMode]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5">
          <div>
            <FieldLabel htmlFor="title">Build Title</FieldLabel>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={80}
              className="mt-2 h-12 w-full rounded-md border border-white/10 bg-abyss/[0.72] px-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-frost/50"
              placeholder={selectedChampion ? `${selectedChampion.name} chaos setup` : "Chaos setup"}
            />
          </div>
          <TextAreaField
            id="description"
            label="Build Description"
            value={description}
            onChange={setDescription}
            rows={5}
            placeholder="Explain the fight pattern, power spike, and why this setup deserves testing."
          />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Build Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chaosBuildTags.map((tag) => {
                const isSelected = tags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                      isSelected
                        ? "border-frost/35 bg-frost/[0.14] text-white shadow-[0_0_24px_rgba(66,214,255,0.14)]"
                        : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-frost/25 hover:text-white"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <Beaker className="h-5 w-5 text-ember" aria-hidden="true" />
          <h2 className="text-2xl font-black text-white">Build Path</h2>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <TextAreaField
            id="item-order"
            label="Item Order"
            value={itemOrder}
            onChange={setItemOrder}
            rows={7}
            placeholder={"Liandry's Torment\nSorcerer's Shoes\nRylai's Crystal Scepter"}
          />
          <TextAreaField
            id="augments"
            label="Augments"
            value={augments}
            onChange={setAugments}
            rows={7}
            placeholder={"vulnerability\nphenomenal-evil\njeweled-gauntlet"}
          />
        </div>
      </section>

      <section className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-volt" aria-hidden="true" />
          <h2 className="text-2xl font-black text-white">Lab Notes</h2>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <TextAreaField id="strengths" label="Strengths" value={strengths} onChange={setStrengths} rows={8} placeholder={"Strong two-item spike\nReliable teamfight pressure"} />
          <TextAreaField id="weaknesses" label="Weaknesses" value={weaknesses} onChange={setWeaknesses} rows={8} placeholder={"Needs setup time\nWeak when denied first engage"} />
          <TextAreaField id="matchups" label="Matchup Notes" value={matchupNotes} onChange={setMatchupNotes} rows={8} placeholder={"Avoid heavy displacement\nStrong into short-range carries"} />
        </div>
      </section>

      {messages.length ? (
        <div className={`rounded-md border px-4 py-3 text-sm font-bold ${state === "error" ? "border-ember/25 bg-ember/[0.08] text-ember" : "border-volt/25 bg-volt/[0.08] text-volt"}`}>
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-md border border-volt/30 bg-volt/[0.12] px-5 text-sm font-black text-volt transition hover:bg-volt/[0.18] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        Submit Build
      </button>
    </form>
  );
}
