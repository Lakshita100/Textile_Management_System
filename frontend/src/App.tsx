import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { SessionProvider } from './store/SessionProvider'
import { InspectionFormProvider } from './store/InspectionFormProvider'
import QualityDashboardPage from './pages/quality/QualityDashboardPage'
import AllInspectionsPage from './pages/quality/AllInspectionsPage'
import { EmptyState } from './components/ui/StateViews'

function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist in the quality module."
    />
  )
}

export default function App() {
  return (
    <SessionProvider>
      <InspectionFormProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/quality" replace />} />
            <Route path="/quality" element={<QualityDashboardPage />} />
            <Route path="/quality/inspections" element={<AllInspectionsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </InspectionFormProvider>
    </SessionProvider>
  )
}
