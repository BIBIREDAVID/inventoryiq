import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  return children;
} {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  );

  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return children;
}