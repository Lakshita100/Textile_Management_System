import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import RawMaterialsPage from './features/raw-materials';

export default function App() {
  return (
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
