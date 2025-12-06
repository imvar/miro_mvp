import { Navigate } from "react-router";

// В PublicRoute может быть проблема с консолью:
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token');
  console.log(isAuthenticated);
  

  return !isAuthenticated ? <>{children}</> : <Navigate to="/boards" replace />;
};