export type SkillCategory = {
  id: string
  title: string
  skills: string[]
}

export const skillCategories: SkillCategory[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    skills: ['TypeScript', 'JavaScript', 'React', 'Vite', 'Astro', 'Tailwind', 'Shadcn UI', 'HTML5', 'CSS3'],
  },
  {
    id: 'backend',
    title: 'Backend',
    skills: ['Python', 'C#', 'FastAPI', 'TypeScript'],
  },
  {
    id: 'databases',
    title: 'Bases de Datos',
    skills: ['PostgreSQL', 'MySQL', 'SQLite', 'Supabase'],
  },
  {
    id: 'data-analysis',
    title: 'Análisis de Datos',
    skills: ['Pandas', 'Numpy', 'Matplotlib', 'PowerBI'],
  },
  {
    id: 'animation',
    title: 'Animación',
    skills: ['Motion', 'Lenis', 'GSAP'],
  },
  {
    id: 'tools',
    title: 'Herramientas',
    skills: ['Git', 'GitHub', 'Docker', 'Cursor', 'Figma'],
  },
]