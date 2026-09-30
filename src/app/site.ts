// The site's public address — used for share links, the sitemap and search metadata.
// If a custom domain is connected in Vercel, change it here.
export const SITE_URL = 'https://rayenchatti.vercel.app'

// Structured data (schema.org) so search engines know this page is about a person,
// and can tie it to the same person's LinkedIn and GitHub
export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Rayen Chatti',
  alternateName: 'Mohamed Rayen Chatti',
  url: SITE_URL,
  image: `${SITE_URL}/head-removebg-preview.png`,
  jobTitle: 'Software Engineering Student',
  description:
    'Software Engineering student specializing in Web & Mobile development, AI integration and Cybersecurity. 2x hackathon winner.',
  email: 'mailto:rayen.chatti2005@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Mahdia', addressCountry: 'TN' },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Higher Institute of Computer Science of Mahdia (ISIMa)',
  },
  knowsAbout: ['Web Development', 'Mobile Development', 'Artificial Intelligence', 'RAG', 'Cybersecurity'],
  sameAs: ['https://linkedin.com/in/chatti-rayen', 'https://github.com/rayenchatti'],
}
