import { projects } from '@/data/projects'

export const projectPresentation: Record<string, {
  summary: string
  role: string
  width: number
  height: number
  technologies: string[]
}> = {
  ixtli: {
    summary: 'Todos tus negocios en una aplicación, con información clara para saber qué hacer.',
    role: 'Producto web · Diseño y desarrollo',
    width: 1901,
    height: 901,
    technologies: ['React', 'Supabase', 'TypeScript'],
  },
  bohorquez: {
    summary: 'Sitio web para una empresa de construcción y remodelación en Toronto.',
    role: 'Sitio web · Diseño y desarrollo',
    width: 632,
    height: 622,
    technologies: ['Astro', 'React', 'Motion'],
  },
  'ixtli-data': {
    summary: 'Encuentra qué vender, a qué precio y dónde competir con menos riesgo en Mercado Libre.',
    role: 'Análisis de datos · Automatización',
    width: 772,
    height: 663,
    technologies: ['Python', 'Selenium', 'Pandas'],
  },
}

const order = ['ixtli', 'bohorquez', 'ixtli-data']
export const editorialProjects = [...projects].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
