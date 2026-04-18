import type { ReactNode } from 'react'

export default function PageFrame({
  sidebar,
  children,
  className = '',
  sidebarClassName = '',
  contentClassName = '',
}: {
  sidebar: ReactNode
  children: ReactNode
  className?: string
  sidebarClassName?: string
  contentClassName?: string
}) {
  return (
    <main
      className={`mx-[calc(50%-50vw)] w-screen grid grid-cols-1 lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)] ${className}`.trim()}
    >
      <aside className={`px-6 py-10 lg:pl-16 lg:pr-10 ${sidebarClassName}`.trim()}>
        {sidebar}
      </aside>

      <section
        className={`min-w-0 border-l border-black/50 px-6 py-10 lg:col-span-2 lg:px-8 lg:pr-16 ${contentClassName}`.trim()}
      >
        {children}
      </section>
    </main>
  )
}
