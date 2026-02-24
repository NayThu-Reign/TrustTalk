import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function AuthRouteProvider ({ children })  {
    const { authUser } = useAuth();

  return authUser ? <Navigate to="/" /> : <Navigate to="/login" />;
};