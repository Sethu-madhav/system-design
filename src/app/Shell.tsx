import type { ReactNode } from "react"
import { Paper } from "@/components/ui/paper"
import { href } from "@/app/routes"

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center px-4 py-6 md:px-8">
        <a href={href({ name: "home" })} className="font-script text-2xl font-bold text-ink">
          System design
        </a>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 md:grid md:grid-cols-[14rem_1fr] md:px-8">
        <aside data-testid="sidebar" aria-label="Lessons" className="hidden md:block" />
        <main data-testid="page">
          <Paper stock="paper" as="article" className="px-6 py-8 md:px-10 md:py-12">
            {children}
          </Paper>
        </main>
      </div>
    </div>
  )
}
