import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import RawMaterialsPage from './features/raw-materials';
import MachinesPage from './pages/Machines';
import MachineDetailPage from './pages/MachineDetail';
import JobsPage from './pages/Jobs';
import RecommendPage from './pages/Recommend';
import QualityDashboardPage from './pages/quality/QualityDashboardPage';
import AllInspectionsPage from './pages/quality/AllInspectionsPage';
import NotFoundPage from './pages/NotFoundPage';
import { SessionProvider } from './store/SessionProvider';
import { InspectionFormProvider } from './store/InspectionFormProvider';

export default function App() {
  return (
    <SessionProvider>
      <InspectionFormProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inventory" element={<RawMaterialsPage defaultSection="inventory" hideTabs />} />
              <Route path="/raw-materials" element={<RawMaterialsPage defaultSection="inventory" hideTabs />} />
              <Route path="/alerts" element={<RawMaterialsPage defaultSection="alerts" hideTabs />} />
              <Route path="/movements" element={<RawMaterialsPage defaultSection="movements" hideTabs />} />
              <Route path="/suppliers" element={<RawMaterialsPage defaultSection="suppliers" hideTabs />} />
              <Route path="/purchases" element={<RawMaterialsPage defaultSection="purchases" hideTabs />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/machines/:id" element={<MachineDetailPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/recommend" element={<RecommendPage />} />
              <Route path="/quality" element={<QualityDashboardPage />} />
              <Route path="/quality/inspections" element={<AllInspectionsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InspectionFormProvider>
    </SessionProvider>
  );
}
