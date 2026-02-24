import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRouteProvider({ children }) {
  const { isAuthReady, authUser, loading: isLoading } = useAuth();
 
const location = useLocation();

if(isLoading) {
  return <div>loading...</div>
}
  
  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}