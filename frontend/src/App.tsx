import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
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
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/machines/:id" element={<MachineDetailPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
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
      </Routes>
    </BrowserRouter>
  );
}
