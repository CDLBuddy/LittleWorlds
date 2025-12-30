import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Disabled StrictMode - it causes double initialization of Babylon engine which breaks keyboard input
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
);
