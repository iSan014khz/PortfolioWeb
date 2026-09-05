import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type CardProps = HTMLAttributes<HTMLElement>

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <article
      className={cn('rounded-2xl border border-border bg-surface p-6', className)}
      {...props}
    >
      {children}
    </article>
  )
}
