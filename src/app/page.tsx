import HeroSection from '@/components/HeroSection'
import AboutSection from '@/components/AboutSection'
import ServicesSection from '@/components/ServicesSection'
import ProjectsSection from '@/components/ProjectsSection'
import AchievementsSection from '@/components/AchievementsSection'
import ContactSection from '@/components/ContactSection'

export default function Home() {
  return (
    <main className="min-h-dvh w-full bg-transparent">
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <AchievementsSection />
      <ContactSection />
    </main>
  )
}
