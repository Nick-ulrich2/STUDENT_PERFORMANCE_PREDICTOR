import { JsonLd } from '@/components/seo/JsonLd';
import { HomePage } from '@/components/landing/HomePage';

// Server wrapper: the structured data is rendered in the visitor's language,
// the page itself is a client component so the language switch is instant.
export default function Page() {
  return (
    <>
      <JsonLd />
      <HomePage />
    </>
  );
}
