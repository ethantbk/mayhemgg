import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-abyss/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-black text-white">MayhemGG</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            Focused League of Legends intelligence for ARAM Mayhem and Arena. Mock statistics are structured for future Riot API and PostgreSQL ingestion.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/champions" className="hover:text-white">Champions</Link>
            <Link href="/tier-list" className="hover:text-white">Tier List</Link>
            <Link href="/broken-builds" className="hover:text-white">Broken Builds</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Modes</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <span>ARAM Mayhem</span>
            <span>Arena</span>
            <span>Champion Guides</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
