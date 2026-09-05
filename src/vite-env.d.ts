/// <reference types="vite/client" />

declare module '*.bin?url' {
  const src: string
  export default src
}
