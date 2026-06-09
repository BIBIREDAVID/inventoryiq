import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const TITLES = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/stock": "Stock",
  "/locations": "Locations",
  "/orders": "Purchase Orders",
  "/suppliers": "Suppliers",
  "/adjustments": "Adjustments",
  "/reports": "Reports",
  "/users": "Users",
  "/settings": "Settings",
};

export default function DashboardShell() {
  const { pathname } = useLocation();
  return (
    <div className="bg-[#0f1117] min-h-screen text-white">
      <Sidebar />
      <TopBar title={TITLES[pathname] || "InventoryIQ"} />
      <main className="ml-64 pt-14 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
