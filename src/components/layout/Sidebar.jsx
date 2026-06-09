import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { label: "Dashboard",      path: "/dashboard",   roles: ["admin","manager","staff"], icon: "▣" },
  { label: "Products",       path: "/products",    roles: ["admin","manager"],         icon: "⊞" },
  { label: "Stock",          path: "/stock",       roles: ["admin","manager","staff"], icon: "◫" },
  { label: "Locations",      path: "/locations",   roles: ["admin","manager","staff"], icon: "⊡" },
  { label: "Purchase Orders",path: "/orders",      roles: ["admin","manager"],         icon: "◱" },
  { label: "Suppliers",      path: "/suppliers",   roles: ["admin","manager"],         icon: "◳" },
  { label: "Adjustments",    path: "/adjustments", roles: ["admin","manager","staff"], icon: "◲" },
  { label: "Reports",        path: "/reports",     roles: ["admin","manager"],         icon: "▤" },
  { label: "Users",          path: "/users",       roles: ["admin"],                   icon: "◉" },
  { label: "Settings",       path: "/settings",    roles: ["admin"],                   icon: "◎" },
];

export default function Sidebar() {
  const { userRole, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const visible = NAV.filter(i => i.roles.includes(userRole));

  const ROLE_BADGE = {
    admin:   "bg-indigo-500/20 text-indigo-300",
    manager: "bg-cyan-500/20 text-cyan-300",
    staff:   "bg-emerald-500/20 text-emerald-300",
  };

  return (
    <aside className="w-64 bg-[#1a1d27] border-r border-slate-700/50 flex flex-col h-screen fixed top-0 left-0">
      <div className="px-6 py-5 border-b border-slate-700/50">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Inventory<span className="text-indigo-500">IQ</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map((item) => (
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

      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {currentUser?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{currentUser?.email}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_BADGE[userRole]}`}>
              {userRole}
            </span>
          </div>
        </div>
        <button onClick={async () => { await logout(); navigate("/login"); }}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white transition">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
