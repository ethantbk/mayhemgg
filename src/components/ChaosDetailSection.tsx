import type { ReactNode } from "react";

export function ChaosDetailSection({
  eyebrow,
  title,
  children,
  featured = false
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  featured?: boolean;
}) {
  return (
    <section className={`premium-border rounded-lg p-5 shadow-card sm:p-6 ${featured ? "feature-depth bg-[linear-gradient(145deg,rgba(255,107,61,0.12),rgba(16,22,36,0.88)_42%,rgba(66,214,255,0.07))]" : "bg-panel/[0.72]"}`}>
      {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-volt">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ChaosBulletList({ items, tone = "frost" }: { items: string[]; tone?: "frost" | "volt" | "ember" }) {
  const dotClass = tone === "volt" ? "bg-volt" : tone === "ember" ? "bg-ember" : "bg-frost";

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item} className="row-hover flex gap-3 rounded-md border border-white/10 bg-white/[0.045] p-4">
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
          <p className="text-sm leading-6 text-slate-300">{item}</p>
        </div>
      ))}
    </div>
  );
}
