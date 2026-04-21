import type { ReactNode } from 'react'

export default function PageFrame({
  sidebar,
  children,
  className = '',
  sidebarClassName = '',
  contentClassName = '',
  mergeContent = false,
  contentScroll = false,
}: {
  sidebar: ReactNode
  children: ReactNode
  className?: string
  sidebarClassName?: string
  contentClassName?: string
  mergeContent?: boolean
  contentScroll?: boolean
}) {
  return (
    <main
      className={`mx-[calc(50%-50vw)] w-screen grid grid-cols-1 lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)] ${
        contentScroll
          ? 'lg:h-[calc(100dvh-4rem)] lg:overflow-hidden'
          : 'lg:min-h-[calc(100dvh-4rem)]'
      } ${className}`.trim()}
    >
      <aside
        className={`px-6 py-10 ${
          contentScroll
            ? 'lg:h-[calc(100dvh-4rem)] lg:overflow-hidden'
            : 'lg:min-h-[calc(100dvh-4rem)]'
        } lg:pl-16 lg:pr-10 ${sidebarClassName}`.trim()}
      >
        {sidebar}
      </aside>

      <section
        className={`relative min-w-0 border-l border-black/50 lg:col-span-2 ${
          contentScroll
            ? 'lg:h-[calc(100dvh-4rem)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain'
            : 'lg:min-h-[calc(100dvh-4rem)]'
        } ${
          mergeContent
            ? ''
            : "lg:before:pointer-events-none lg:before:absolute lg:before:inset-y-0 lg:before:left-1/2 lg:before:z-20 lg:before:border-l lg:before:border-black/50 lg:before:content-['']"
        } ${contentClassName}`.trim()}
      >
        <div className="relative z-10 px-6 py-10 lg:px-8 lg:pr-16">
          {children}
        </div>
      </section>
    </main>
  )
}
