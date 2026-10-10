import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { StatisticsStrip } from '../components/StatisticsStrip';
import { FeaturesSection } from '../components/FeaturesSection';
import { DashboardPreview } from '../components/DashboardPreview';
import { WorkflowSection } from '../components/WorkflowSection';
import { RolesSection } from '../components/RolesSection';
import { BenefitsSection } from '../components/BenefitsSection';
import { FinalCTA } from '../components/FinalCTA';
import { Footer } from '../components/Footer';
import { useReveal } from '../hooks/useReveal';

export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-surface">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <HeroSection />
        <StatisticsStrip />
        <FeaturesSection />
        <DashboardPreview />
        <WorkflowSection />
        <RolesSection />
        <BenefitsSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
