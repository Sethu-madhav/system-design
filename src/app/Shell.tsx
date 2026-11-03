import { useState, type ReactNode } from "react"
import { href, useRoute } from "@/app/routes"
import { SearchPalette } from "@/app/SearchPalette"
import { curriculum } from "@/content"
import { Paper } from "@/components/ui/paper"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { useProgress } from "@/progress"
import type { LessonStatus } from "@/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const STATUS_MARK: Record<LessonStatus, { icon: string; label: string }> = {
  new: { icon: "circle", label: "Not started" },
  started: { icon: "circle-minus", label: "Started" },
  done: { icon: "circle-check", label: "Done" },
}

function LessonNav({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRoute()
  const { status } = useProgress()
  return (
    <Sidebar collapsible="none" className="w-full">
      <SidebarContent>
        {curriculum.tracks.map((track) => (
          <SidebarGroup key={track.id}>
            <SidebarGroupLabel>{track.title}</SidebarGroupLabel>
            <SidebarMenu>
              {track.lessons.map((lesson) => {
                const lessonStatus = status(lesson.slug)
                const mark = STATUS_MARK[lessonStatus]
                return (
                  <SidebarMenuItem key={lesson.slug}>
                    <SidebarMenuButton asChild isActive={route.name === "lesson" && route.slug === lesson.slug}>
                      <a href={href({ name: "lesson", slug: lesson.slug })} onClick={onNavigate}>
                        {lesson.title}
                        <span data-testid="lesson-status" data-slug={lesson.slug} data-status={lessonStatus} className="ms-auto">
                          <Icon name={mark.icon} size={16} label={mark.label} />
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarProvider className="block">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 md:px-8">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" data-testid="menu-open" aria-label="Open lessons" className="md:hidden">
                <Icon name="menu" size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" data-testid="sidebar-sheet">
              <SheetHeader><SheetTitle>Lessons</SheetTitle></SheetHeader>
              <LessonNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <a href={href({ name: "home" })} className="font-script text-2xl font-bold text-ink">
            System design
          </a>
        </div>
        <SearchPalette />
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 overflow-x-clip px-4 pb-12 md:grid md:grid-cols-[14rem_1fr] md:px-8">
        <aside data-testid="sidebar" aria-label="Lessons" className="hidden md:block">
          <LessonNav />
        </aside>
        <main data-testid="page" className="min-w-0">
          <Paper stock="paper" as="article" tilt={false} className="px-6 py-8 md:px-10 md:py-12">
            {children}
          </Paper>
        </main>
      </div>
    </SidebarProvider>
  )
}
