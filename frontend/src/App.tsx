import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardPage from './pages/Dashboard';
import MachinesPage from './pages/Machines';
import MachineDetailPage from './pages/MachineDetail';
import JobsPage from './pages/Jobs';
import RecommendPage from './pages/Recommend';
import AnalyticsPage from './pages/Analytics';
import AppShell from './components/layout/AppShell';
import { SessionProvider } from './store/SessionProvider';
import { InspectionFormProvider } from './store/InspectionFormProvider';
import QualityDashboardPage from './pages/quality/QualityDashboardPage';
import AllInspectionsPage from './pages/quality/AllInspectionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing / marketing entry point */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />

        {/* Factory management application */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="machines" element={<MachinesPage />} />
          <Route path="machines/:id" element={<MachineDetailPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="recommend" element={<RecommendPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        <Route
          path="/quality"
          element={
            <SessionProvider>
              <InspectionFormProvider>
                <AppShell />
              </InspectionFormProvider>
            </SessionProvider>
          }
        >
          <Route index element={<QualityDashboardPage />} />
          <Route path="inspections" element={<AllInspectionsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
