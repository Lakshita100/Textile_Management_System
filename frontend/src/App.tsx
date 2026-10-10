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
import PackingPage from './pages/packing/PackingPage';
import DispatchPage from './pages/dispatch/DispatchPage';
import { BuyerLoginPage, BuyerSignupPage, ForgotPasswordPage } from './pages/BuyerAuth';
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
  AdminModulePlaceholderPage,
} from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing / marketing entry point */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<BuyerLoginPage />} />
        <Route path="/signup" element={<BuyerSignupPage />} />
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
          <Route path="materials" element={<AdminModulePlaceholderPage title="Material Management" description="Capacity planning, raw material allocation, supplier intake and cut planning." />} />
          <Route path="production" element={<AdminModulePlaceholderPage title="Production Management" description="Machine scheduling, WIP monitoring and shop-floor coordination across spinning and weaving." />} />
          <Route path="quality" element={<AdminModulePlaceholderPage title="Quality Management" description="Inspection checkpoints, defect tracking, lot acceptance and compliance reporting." />} />
          <Route path="dispatch" element={<AdminModulePlaceholderPage title="Dispatch & Delivery" description="Shipment readiness, route coordination, dispatch notes and final delivery status." />} />
        </Route>

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
          <Route path="packing" element={<PackingPage />} />
          <Route path="dispatch" element={<DispatchPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
