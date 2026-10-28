import { useState } from 'react'
import { projects } from '@/data/projects'
import ProjectCase, { type CaseTypography } from '@/components/projects/ProjectCase'
import '@/components/projects/projects.css'
import './preview.css'

const options = [
  { id: 'editorial', label: 'Editorial', detail: 'Nombre protagonista, subtítulo discreto y lectura pausada.' },
  { id: 'direct', label: 'Directo', detail: 'Una sola familia, títulos compactos y contenido alineado por temas.' },
  { id: 'visual', label: 'Visual', detail: 'La captura abre el caso; después aparece la idea principal.' },
] as const

export default function CaseTypographyPreview() {
  const params = new URLSearchParams(location.search)
  const [style, setStyle] = useState<CaseTypography>(() => options.find(option => option.id === params.get('estilo'))?.id ?? 'editorial')
  const [projectId, setProjectId] = useState(() => projects.find(project => project.id === params.get('proyecto'))?.id ?? 'bohorquez')
  const [open, setOpen] = useState(true)
  const project = projects.find(project => project.id === projectId)!
  const current = options.find(option => option.id === style)!
  const remember = (key: string, value: string) => {
    const url = new URL(location.href)
    url.searchParams.set(key, value)
    history.replaceState(null, '', url)
  }
  const controls = <div className="case-preview-controls">
    <div className="case-preview-options" role="group" aria-label="Estilo del diálogo">
      {options.map(option => <button key={option.id} type="button" aria-pressed={style === option.id} onClick={() => { setStyle(option.id); remember('estilo', option.id) }}>{option.label}</button>)}
    </div>
    <label className="case-preview-project"><span className="sr-only">Proyecto</span><select aria-label="Proyecto del caso" value={projectId} onChange={event => { setProjectId(event.target.value); remember('proyecto', event.target.value) }}>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  </div>
  return <main className="case-preview-page">
    <a className="case-preview-back" href="/#projects">Volver a la página</a>
    <h1>Opciones de «Ver caso»</h1>
    <p>{current.detail}</p>
    <button className="case-preview-reopen" type="button" onClick={() => setOpen(true)}>Abrir diálogo</button>
    {open && <ProjectCase project={project} onClose={() => setOpen(false)} typography={style} previewControls={controls} />}
  </main>
}
