import { faqs } from '@/data/faqs';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import { getT } from '@/lib/i18n/server';

// Two schema.org types on the homepage: WebApplication (so Google can show
// it as a tool/app rather than a generic article) and FAQPage, built from
// the same data/faqs.ts content already rendered on the page — never
// duplicated or invented, just the real FAQ marked up for rich results.
export async function JsonLd() {
  const { locale, t } = await getT();
  const webApplication = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: t(SITE_DESCRIPTION),
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    inLanguage: locale === 'en' ? 'en-GB' : 'fr-FR',
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
      name: t(question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(answer),
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
