import { Navigate } from "react-router";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token');
  const test = !!isAuthenticated;
  
  return test ? <>{children}</> : <Navigate to="/login" replace />;
};
