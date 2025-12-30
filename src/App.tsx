import { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { AppRoutes } from './router/routes';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { eventBus } from './game/shared/events';

function AppContent() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsub = eventBus.on((event) => {
      if (event.type === 'ui/quit') {
        navigate('/profiles');
      }
    });
    
    return unsub;
  }, [navigate]);
  
  return <AppRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
