import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './preview.css'
import { Preview } from './Preview'

createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
