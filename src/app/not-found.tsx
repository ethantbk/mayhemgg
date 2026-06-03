import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">404</p>
      <h1 className="mt-3 text-4xl font-black text-white">This guide is off the map.</h1>
      <p className="mt-4 text-slate-400">The champion or page you are looking for is not in the current MayhemGG mock database.</p>
      <Link href="/champions" className="mt-8 rounded-md bg-frost px-5 py-3 text-sm font-black text-abyss hover:bg-volt">
        Browse Champions
      </Link>
    </div>
  );
}
