import { Navbar } from '@/components/layout/Navbar';
import { JsonLd } from '@/components/seo/JsonLd';
import { HeroSection } from '@/sections/HeroSection';
import { HowItWorksSection } from '@/sections/HowItWorksSection';
import { ProductPreviewSection } from '@/sections/ProductPreviewSection';
import { TrustSection } from '@/sections/TrustSection';
import { AudienceSection } from '@/sections/AudienceSection';
import { FAQSection } from '@/sections/FAQSection';
import { FinalCTASection } from '@/sections/FinalCTASection';

export default function Page() {
  return (
    <main id="top">
      <JsonLd />
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <ProductPreviewSection />
      <TrustSection />
      <AudienceSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
