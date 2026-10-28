import { lazy, Suspense, type CSSProperties } from 'react'
import Nav from '@/components/Nav'
import SmoothScroll from '@/components/smooth-scroll'
// import Transition from '@/components/transiton'
import About from '@/sections/Copy'
// import Contact from '@/sections/Contact'
import Footer from '@/sections/Footer'
import Hero from '@/sections/Hero'
// import Philosophy from '@/sections/Philosophy'
import Projects from '@/components/projects/ProjectsEditorial'
import Skills from '@/sections/Skills'
import WhyMe from '@/sections/WhyMe'

const SHOW_GRID = false // activa mientras maquetas, apaga antes de commitear
const CaseTypographyPreview = import.meta.env.DEV
  ? lazy(() => import('@/prototypes/case-typography/CaseTypographyPreview'))
  : null

function GridOverlay() {
  return (
    <div
      aria-hidden
      style={{ '--gap': '20px', '--margin': '20px' } as CSSProperties}
      className="pointer-events-none fixed inset-0 z-50 overflow-clip p-[var(--margin)]"
    >
      <div
        className="grid h-full w-full gap-[var(--gap)]"
        style={{
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="border border-red-500/30 bg-red-500/5" />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  if (CaseTypographyPreview && new URLSearchParams(location.search).has('case-preview')) {
    return <Suspense fallback={null}><CaseTypographyPreview /></Suspense>
  }
  return (
    <SmoothScroll>
      <div className="relative min-h-svh w-full bg-bg text-text">
        {SHOW_GRID && <GridOverlay />}
        {/* <Transition /> */}

        <main className="relative z-10 flex min-h-svh w-full flex-col items-center bg-bg shadow-2xl">
          <Nav />
          <Hero />
          <About />
          <Projects />
          <Skills />
          <WhyMe />
          {/* <Contact /> */}
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  )
}
