// src/App.jsx
import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Accueil from './pages/Accueil';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Apropos from './pages/Apropos';
import NotFound from './pages/NotFound';
import Login from './components/Login';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Dashboard from './admin/Dashboard';
import ReservationDetail from './admin/ReservationDetail';
import Terrains from './admin/Terrains';
import Creneaux from './admin/Creneaux';
import Facturation from './admin/Facturation';
import Profil from './admin/Profil';
import ContactMessages from './admin/ContactMessages';
import authStore from './store/authStore';
import { useEffect } from 'react';
import { I18nProvider } from './i18n';

function AuthGate({ children }) {
  const { isAuth, fetchMe, setAccess, logout } = authStore();
  const navigate = useNavigate();

  useEffect(() => {
    const access = localStorage.getItem('access');
    if (access && !isAuth) setAccess(access);
  }, [isAuth, setAccess]);

  useEffect(() => {
    if (isAuth) fetchMe();
  }, [isAuth, fetchMe]);

  useEffect(() => {
    if (!isAuth) return;

    const timeoutMs = 3 * 60 * 1000;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    let timeoutId;

    const disconnect = () => {
      logout();
      navigate('/login');
    };

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(disconnect, timeoutMs);
    };

    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [isAuth, logout, navigate]);

  return children;
}

function Protected({ children }) {
  const { isAuth } = authStore();
  if (!isAuth) return <Login />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthGate>
          <NavBar />
          <Routes>
            <Route path="/"         element={<Accueil />}  />
            <Route path="/services" element={<Services />} />
            <Route path="/contact"  element={<Contact />}  />
            <Route path="/apropos"  element={<Apropos />}  />
            <Route path="/login"    element={<Login />}    />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/dashboard/reservations/:id" element={<Protected><ReservationDetail /></Protected>} />
            <Route path="/dashboard/terrains" element={<Protected><Terrains /></Protected>} />
            <Route path="/dashboard/creneaux" element={<Protected><Creneaux /></Protected>} />
            <Route path="/dashboard/facturation" element={<Protected><Facturation /></Protected>} />
            <Route path="/dashboard/contact-messages" element={<Protected><ContactMessages /></Protected>} />
            <Route path="/dashboard/profil" element={<Protected><Profil /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </AuthGate>
      </I18nProvider>
    </BrowserRouter>
  );
}