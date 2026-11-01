import { useLayoutEffect, useState } from 'react'
import AppCopy from './AppCopy'

export function Preview() {
  const [original, setOriginal] = useState(() => new URLSearchParams(location.search).get('vista') === 'actual')

  useLayoutEffect(() => {
    // La copia abre directamente en proyectos, conservando las secciones vecinas.
    const frame = requestAnimationFrame(() => {
      const target = original ? document.getElementById('projects') : document.querySelector('.project-scroll-track')
      target?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [original])

  const choose = (value: boolean) => {
    setOriginal(value)
    const url = new URL(location.href)
    url.searchParams.set('vista', value ? 'actual' : 'propuesta')
    history.replaceState(null, '', url)
  }

  return (
    <>
      <AppCopy original={original} />
      <nav className="projects-copy-toolbar" aria-label="Comparar proyectos">
        <a href="/#projects">Página principal</a>
        <div className="projects-copy-switch" role="group" aria-label="Vista de la copia">
          <button type="button" aria-pressed={original} onClick={() => choose(true)}>Actual</button>
          <button type="button" aria-pressed={!original} onClick={() => choose(false)}>Propuesta</button>
        </div>
      </nav>
    </>
  )
}
