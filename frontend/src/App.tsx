import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
