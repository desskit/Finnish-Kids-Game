import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProfileProvider } from './state/profile';
import CrashScreen from './components/CrashScreen';
import { keepAppUpdated } from './pwaUpdate';
import './styles/fonts.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CrashScreen>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </CrashScreen>
  </React.StrictMode>,
);

keepAppUpdated();
