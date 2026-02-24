import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import UIStateProvider from './providers/UIStateProvider.jsx';
import AuthProvider from './providers/AuthProvider.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatsProvider from './providers/ChatsProvider.jsx';
import ThemeProvider from './providers/ThemeAppProvider.jsx';
import ThemeAppProvider from './providers/ThemeAppProvider.jsx';
import AuthGate from './providers/AuthGate.jsx';
import ErrorBoundary from './providers/ErrorBoundary.jsx';
import { useParams } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});






createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UIStateProvider>
      <AuthProvider>
        <AuthGate>
          <QueryClientProvider client={queryClient}>
            <ChatsProvider>
            <ThemeAppProvider>
              <ErrorBoundary key={window.location.pathname}>
                <App />
              </ErrorBoundary>
            </ThemeAppProvider>
            </ChatsProvider>
          </QueryClientProvider>
        </AuthGate>
      </AuthProvider>
    </UIStateProvider>
  </StrictMode>,
)
