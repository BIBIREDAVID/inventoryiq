import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardShell from "./components/layout/DashboardShell";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/products/ProductsPage";
import StockPage from "./pages/stock/StockPage";
import LocationsPage from "./pages/locations/LocationsPage";
import SuppliersPage from "./pages/suppliers/SuppliersPage";
import PurchaseOrdersPage from "./pages/orders/PurchaseOrdersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="orders" element={<PurchaseOrdersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;