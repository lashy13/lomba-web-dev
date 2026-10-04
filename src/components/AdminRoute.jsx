import { Navigate, useLocation } from "react-router-dom";

function AdminRoute({ children }) {
  const location = useLocation();

  const isAdminLoggedIn =
    localStorage.getItem("adminLoggedIn") === "true";

  if (!isAdminLoggedIn) {
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default AdminRoute;