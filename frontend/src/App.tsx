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
import AttendancePage from './pages/AttendancePage';
import AdminEmployeesPage from './pages/AdminEmployeesPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
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
              <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
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
<Route path="employees" element={<AdminEmployeesPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="materials" element={<RawMaterialsPage defaultSection="inventory" hideTabs />} />
                <Route path="inventory" element={<RawMaterialsPage defaultSection="inventory" hideTabs />} />
                <Route path="alerts" element={<RawMaterialsPage defaultSection="alerts" hideTabs />} />
                <Route path="movements" element={<RawMaterialsPage defaultSection="movements" hideTabs />} />
                <Route path="suppliers" element={<RawMaterialsPage defaultSection="suppliers" hideTabs />} />
                <Route path="purchases" element={<RawMaterialsPage defaultSection="purchases" hideTabs />} />
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
                  <Route path="/dashboard" element={<RequireAuth permission="production"><DashboardPage /></RequireAuth>} />
                  <Route path="/inventory" element={<RequireAuth permission="materials"><RawMaterialsPage defaultSection="inventory" hideTabs /></RequireAuth>} />
                  <Route path="/raw-materials" element={<RequireAuth permission="materials"><RawMaterialsPage defaultSection="inventory" hideTabs /></RequireAuth>} />
                  <Route path="/alerts" element={<RequireAuth permission="materials"><RawMaterialsPage defaultSection="alerts" hideTabs /></RequireAuth>} />
                  <Route path="/movements" element={<RequireAuth permission="materials"><RawMaterialsPage defaultSection="movements" hideTabs /></RequireAuth>} />
                  <Route path="/suppliers" element={<RequireAuth permission="materials"><RawMaterialsPage defaultSection="suppliers" hideTabs /></RequireAuth>} />
                  <Route path="/purchases" element={<RequireAuth permission="materials"><RawMaterialsPage defaultSection="purchases" hideTabs /></RequireAuth>} />
                  <Route path="/machines" element={<RequireAuth permission="machines"><MachinesPage /></RequireAuth>} />
                  <Route path="/machines/:id" element={<RequireAuth permission="machines"><MachineDetailPage /></RequireAuth>} />
                  <Route path="/jobs" element={<RequireAuth permission="production"><JobsPage /></RequireAuth>} />
                  <Route path="/recommend" element={<RequireAuth permission="recommendations"><RecommendPage /></RequireAuth>} />
                  <Route path="/quality" element={<RequireAuth permission="quality"><QualityDashboardPage /></RequireAuth>} />
                  <Route path="/quality/inspections" element={<RequireAuth permission="quality"><AllInspectionsPage /></RequireAuth>} />
                  <Route path="/quality/packing" element={<RequireAuth permission="quality"><PackingPage /></RequireAuth>} />
                  <Route path="/quality/dispatch" element={<RequireAuth permission="dispatch"><DispatchPage /></RequireAuth>} />
                  <Route path="/attendance" element={<RequireAuth permission="attendance"><AttendancePage /></RequireAuth>} />
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
