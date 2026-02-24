import { useAuth } from './AuthProvider';


export default function AuthGate ({ children })  {
  const { loading, authUser } = useAuth();

  if (loading) return ; // or splash screen

  // if (!authUser) return children; // not authenticated

  return children;
};
