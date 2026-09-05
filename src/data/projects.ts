export type Project = {
  id: string
  name: string
  subtitle: string
  description: string
  detailsTitle?: string
  details: string[]
  challenges?: string[]
  learnings?: string[]
  stack: string[]
  imageUrl: string
  imagePosition?: string
  link?: string
  year: string
}

export const projects: Project[] = [
  {
    id: 'ixtli-data',
    name: 'Ixtli Data',
    subtitle: 'Inteligencia comercial y optimización de ventas para Mercado Libre.',
    description: 'Servicio personalizado de análisis de datos que audita el mercado y a competidores directos para descubrir nichos desatendidos, precios estratégicos y rangos de descuento que maximizan la conversión sin sacrificar margen.',
    details: [
      'Auditoría de mercado y competidores: Extracción automatizada de catálogos para detectar huecos de oportunidad comercial frente a rivales directos.',
      'Segmentación por rango de precio: Filtrado inteligente que aísla competidores directos y descarta productos no equivalentes.',
      'Estimación de demanda y estacionalidad: Proyección del volumen real de ventas y picos de compra (semanales y mensuales) basada en opiniones.',
      'Psicología de precios y descuentos: Identificación algorítmica del rango de descuento más persuasivo sin erosionar la rentabilidad.',
      'Diagnósticos visuales accionables: Gráficos interpretables y guías prácticas para la toma de decisiones comerciales inmediatas.',
    ],
    challenges: [
      'Evasión de rate limiting y bloqueos en la extracción concurrente de miles de publicaciones.',
      'Normalización y limpieza de atributos en publicaciones con descripciones inconsistentes.',
      'Modelado de tendencias estacionales a partir de metadatos y opiniones de compradores.',
    ],
    learnings: [
      'Automatización robusta con Selenium y procesamiento estructurado con Pandas.',
      'Diseño de dashboards analíticos comprensibles para comerciantes no técnicos.',
      'Estrategias de fijación dinámica de precios basadas en elasticidad de mercado.',
    ],
    stack: ['Python', 'Selenium', 'Matplotlib', 'Pandas'],
    imageUrl: '/ixtli-data.png',
    year: '2025',
  },
  {
    id: 'bohorquez',
    name: 'Bohorquez',
    subtitle: 'Landing page enfocada en la captación de clientes.',
    description: 'Diseño y desarrollo de una landing page de alto impacto para contratistas en Canadá. Combina una identidad visual sobria con arquitectura ligera y microinteracciones fluidas, orientada a convertir visitas en cotizaciones directas.',
    details: [
      'Identidad visual sobria y formal: Estética estructurada que transmite solidez, confianza y calidad artesanal en cada proyecto.',
      'Microinteracciones fluidas con Motion: Transiciones físicas sutiles que elevan la percepción de marca sin saturar la navegación.',
      'Flujo de cotización sin fricción: Jerarquía clara que guía al cliente potencial hacia los canales de contacto y solicitud de presupuesto.',
      'Rendimiento instantáneo: Arquitectura desarrollada con Astro y React que garantiza tiempos de carga inmediatos en móviles y escritorio.',
    ],
    challenges: [
      'Balancear microinteracciones enriquecidas sin penalizar la velocidad de carga en móviles.',
      'Diseñar una arquitectura de conversión orientada a clientes corporativos y residenciales.',
      'Optimización de activos visuales pesados de obras terminadas para carga ultra-rápida.',
    ],
    learnings: [
      'Implementación de animaciones basadas en física con resortes mediante Motion.',
      'Estructuración semántica y buenas prácticas SEO para el mercado de Toronto.',
      'Patrones de diseño de alta conversión en servicios de construcción y remodelación.',
    ],
    stack: ['Astro', 'React', 'TypeScript', 'Tailwind CSS', 'Motion'],
    imageUrl: '/bohorquez.png',
    year: '2026',
    link: 'https://bohorquezctrs.com/',
  },
  {
    id: 'ixtli',
    name: 'Ixtli',
    subtitle: 'Gestión de negocios, POS y analítica accesible y amigable para pequeños negocios en LATAM.',
    description: 'Plataforma creada para democratizar la tecnología comercial en Latinoamérica. Sustituirá los costosos equipos y licencias de los POS tradicionales por una solución 100% web, intuitiva y multi-sucursal que combina estética moderna, operaciones en mostrador y analítica accionable.',
    detailsTitle: 'Qué se está construyendo',
    details: [
      'Claridad operativa inmediata (Regla de 5 segundos): Interfaz diseñada para que dueños y colaboradores diagnostiquen el estado y prioridades de sus negocios en segundos.',
      'Accesibilidad y cero fricción de hardware: Operación desde cualquier navegador o dispositivo móvil, eliminando la inversión en equipos dedicados.',
      'Analítica predictiva y tácticas de ahorro: Métricas en tiempo real con recomendaciones directas para reducir mermas, optimizar gastos y elevar ingresos.',
      'Supervisión multi-sucursal centralizada: Panel unificado para administrar y comparar el desempeño de varias sucursales desde una sola cuenta.',
      'Punto de venta y gestión integral: Cobro ágil en mostrador, arqueo automático de turnos, inventario en tiempo real, nóminas y cartera de clientes.',
    ],
    challenges: [
      'Sincronización multi-sucursal en tiempo real de inventarios y cortes de caja.',
      'Diseño ergonómico para operaciones continuas en pantallas táctiles y móviles.',
      'Seguridad granular de roles y permisos por sucursal con Row Level Security.',
    ],
    learnings: [
      'Arquitectura de datos escalable y suscripciones en tiempo real con Supabase.',
      'Patrones de estado optimistas para cobro inmediato sin latencia.',
      'Diseño modular de sistemas de diseño para interfaces de punto de venta.',
    ],
    stack: ['React', 'Vite', 'Supabase', 'TypeScript', 'Tailwind CSS', 'Motion'],
    imageUrl: '/ixtli.png',
    imagePosition: 'object-[1%_center]',
    year: '2026 — En desarrollo',
  },
]
