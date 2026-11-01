import Nav from '@/components/Nav'
import SmoothScroll from '@/components/smooth-scroll'
import About from '@/sections/Copy'
import Footer from '@/sections/Footer'
import Hero from '@/sections/Hero'
import ProjectsOriginal from '@/sections/Projects'
import Skills from '@/sections/Skills'
import WhyMe from '@/sections/WhyMe'
import ProjectsEditorial from './ProjectsEditorial'

export default function AppCopy({ original }: { original: boolean }) {
  return (
    <SmoothScroll>
      <div className="relative min-h-svh w-full bg-bg text-text">
        <main className="relative z-10 flex min-h-svh w-full flex-col items-center bg-bg shadow-2xl">
          <Nav />
          <Hero />
          <About />
          {original ? <ProjectsOriginal /> : <ProjectsEditorial />}
          <Skills />
          <WhyMe />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  )
}
