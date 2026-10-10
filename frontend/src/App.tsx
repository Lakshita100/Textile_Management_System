import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import DashboardPage from './features/dashboard/DashboardPage';
import RawMaterialsPage from './features/raw-materials';
import MachinesPage from './pages/Machines';
import MachineDetailPage from './pages/MachineDetail';
import JobsPage from './pages/Jobs';
import RecommendPage from './pages/Recommend';
import QualityDashboardPage from './pages/quality/QualityDashboardPage';
import AllInspectionsPage from './pages/quality/AllInspectionsPage';
import PackingPage from './pages/packing/PackingPage';
import DispatchPage from './pages/dispatch/DispatchPage';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import { BuyerLoginPage, ForgotPasswordPage } from './pages/BuyerAuth';
import BuyerNewOrderPage from './pages/BuyerNewOrderPage';
import {
  BuyerRouteGuard,
  BuyerDashboardPage,
  BuyerOrdersPage,
  BuyerOrderDetailPage,
  BuyerTrackingPage,
  BuyerProfilePage,
  BuyerInquiriesPage,
} from './pages/BuyerPortal';
import {
  AdminRouteGuard,
  AdminOverviewPage,
  AdminIncomingOrdersPage,
  AdminManualOrderPage,
  AdminOrdersPage,
  AdminOrderReviewPage,
  AdminInquiriesPage,
} from './pages/AdminPanel';
import { AuthProvider } from './store/AuthProvider';
import { SessionProvider } from './store/SessionProvider';
import { InspectionFormProvider } from './store/InspectionFormProvider';

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <InspectionFormProvider>
          <BrowserRouter>
            <Routes>
              {/* Public marketing / account entry points */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<BuyerLoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<LegalPage kind="privacy" />} />
              <Route path="/terms" element={<LegalPage kind="terms" />} />

              {/* Buyer portal */}
              <Route path="/buyer" element={<BuyerRouteGuard />}>
                <Route index element={<BuyerDashboardPage />} />
                <Route path="orders" element={<BuyerOrdersPage />} />
                <Route path="orders/new" element={<BuyerNewOrderPage />} />
                <Route path="orders/:orderId" element={<BuyerOrderDetailPage />} />
                <Route path="tracking" element={<BuyerTrackingPage />} />
                <Route path="profile" element={<BuyerProfilePage />} />
                <Route path="inquiries" element={<BuyerInquiriesPage />} />
              </Route>

              {/* Admin portal */}
              <Route path="/admin" element={<AdminRouteGuard />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="orders/:orderId" element={<AdminOrderReviewPage />} />
                <Route path="incoming" element={<AdminIncomingOrdersPage />} />
                <Route path="manual-order" element={<AdminManualOrderPage />} />
                <Route path="inquiries" element={<AdminInquiriesPage />} />
                <Route path="materials" element={<RawMaterialsPage defaultSection="inventory" hideTabs />} />
                <Route path="alerts" element={<RawMaterialsPage defaultSection="alerts" hideTabs />} />
                <Route path="movements" element={<RawMaterialsPage defaultSection="movements" hideTabs />} />
                <Route path="suppliers" element={<RawMaterialsPage defaultSection="suppliers" hideTabs />} />
                <Route path="production" element={<DashboardPage />} />
                <Route path="machines" element={<MachinesPage />} />
                <Route path="machines/:id" element={<MachineDetailPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="recommend" element={<RecommendPage />} />
                <Route path="quality" element={<QualityDashboardPage />} />
                <Route path="dispatch" element={<DispatchPage />} />
              </Route>

              {/* Factory management application (requires a signed-in staff/admin account) */}
              <Route element={<RequireAuth roles={['staff', 'admin']} />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
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
                  <Route path="/quality/packing" element={<PackingPage />} />
                  <Route path="/quality/dispatch" element={<DispatchPage />} />
                </Route>
              </Route>

              {/* Legacy "/app" paths from earlier builds */}
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />
              <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </InspectionFormProvider>
      </SessionProvider>
    </AuthProvider>
  );
}
