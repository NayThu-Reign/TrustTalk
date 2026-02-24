import { RouterProvider, createBrowserRouter, createHashRouter, useParams } from 'react-router-dom';
import Layout from './Layout';

import AuthProvider from './providers/AuthProvider';
import ProtectedRouteProvider from './providers/ProtectedRouteProvider';

import { useMediaQuery } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense } from 'react';
import RouteError from './pages/RouteError';
import NotFound from './pages/NotFound';
import Login from './pages/Login';


const Conversation = lazy(() => import('./pages/Conversation'));





const App = () => {


 
  
  const router = createHashRouter([
     {
    path: "/login",
    element: (
      
        <Login />
      
    )
  },
    {
      path: "/",
      errorElement: <RouteError />, // 👈 REQUIRED
      element: (
     
        <ProtectedRouteProvider>
          <Layout />
        </ProtectedRouteProvider>
      
      ),
      children: [
       
        
      
        {
          path: "/conversation/:type/:id",
          element: (
            <ProtectedRouteProvider>
              <Suspense fallback={<div>loading...</div>}>
                <Conversation />
              </Suspense>
            </ProtectedRouteProvider>
          )
        },
        
       
        
      ]
    },
    {
      path: "*",
      element: (
        <NotFound />
      )
    },
  ]);

  return (
      
        

      <HelmetProvider>
        
          <RouterProvider router={router} />
      </HelmetProvider>
      
  );
};


export default App;

