import { NavLink } from "react-router-dom";

const NAV = [
  { label: "Dashboard",       path: "/dashboard",   icon: "▣" },
  { label: "Products",        path: "/products",    icon: "⊞" },
  { label: "Stock",           path: "/stock",       icon: "◫" },
  { label: "Locations",       path: "/locations",   icon: "⊡" },
  { label: "Purchase Orders", path: "/orders",      icon: "◱" },
  { label: "Suppliers",       path: "/suppliers",   icon: "◳" },
  { label: "Adjustments",     path: "/adjustments", icon: "◲" },
  { label: "Reports",         path: "/reports",     icon: "▤" },
  { label: "Users",           path: "/users",       icon: "◉" },
  { label: "Settings",        path: "/settings",    icon: "◎" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1a1d27] border-r border-slate-700/50 flex flex-col h-screen fixed top-0 left-0">
      <div className="px-6 py-5 border-b border-slate-700/50">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Inventory<span className="text-indigo-500">IQ</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}