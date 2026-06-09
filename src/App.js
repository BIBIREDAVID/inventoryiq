import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardShell from "./components/layout/DashboardShell";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/products/ProductsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;