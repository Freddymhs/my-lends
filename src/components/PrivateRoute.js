import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../UserContext";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  if (!user?.uid) return <Navigate to="/" replace />;
  return children;
};

export default PrivateRoute;
