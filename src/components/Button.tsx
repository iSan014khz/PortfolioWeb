import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-full bg-accent px-5 py-2 text-sm font-medium text-text transition-opacity hover:opacity-90',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
