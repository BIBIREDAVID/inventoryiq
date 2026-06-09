export default function TopBar({ title }) {
  return (
    <header className="h-14 bg-[#1a1d27] border-b border-slate-700/50 flex items-center px-6 fixed top-0 left-64 right-0 z-10">
      <h2 className="text-white font-semibold text-base">{title}</h2>
    </header>
  );
}
