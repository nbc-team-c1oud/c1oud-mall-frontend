import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const loc = useLocation();

  if (status === "loading") {
    return (
      <div className="container" style={{ padding: "var(--c-sp-10)", textAlign: "center" }}>
        <span className="spinner" aria-label="확인 중" />
      </div>
    );
  }
  if (status !== "authed") {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  return <>{children}</>;
}
