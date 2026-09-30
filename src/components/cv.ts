// The CV, in both languages, served from public/cv — offered from the hero and the contact section
// through the CvDialog picker. To update one, replace its PDF in public/cv (keep the name),
// re-render its preview PNG, and bump CV_UPDATED.
export type CvLang = 'en' | 'fr'

export const CV: Record<CvLang, { url: string; filename: string; preview: string; language: string }> = {
  en: {
    url: '/cv/Rayen-Chatti-CV-EN.pdf',
    filename: 'Rayen-Chatti-CV-EN.pdf',
    preview: '/cv/preview-en.png',
    language: 'English',
  },
  fr: {
    url: '/cv/Rayen-Chatti-CV-FR.pdf',
    filename: 'Rayen-Chatti-CV-FR.pdf',
    preview: '/cv/preview-fr.png',
    language: 'Français',
  },
}

export const CV_UPDATED = 'Sep 2026'
