import { faqs } from '@/data/faqs';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

// Two schema.org types on the homepage: WebApplication (so Google can show
// it as a tool/app rather than a generic article) and FAQPage, built from
// the same data/faqs.ts content already rendered on the page — never
// duplicated or invented, just the real FAQ marked up for rich results.
export function JsonLd() {
  const webApplication = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    inLanguage: 'fr-FR',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
