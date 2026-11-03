import type { ReactNode } from "react"
import { href, useRoute } from "@/app/routes"
import { curriculum } from "@/content"
import { Paper } from "@/components/ui/paper"
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

export function Shell({ children }: { children: ReactNode }) {
  const route = useRoute()

  return (
    <SidebarProvider className="block">
      <header className="mx-auto flex max-w-6xl items-center px-4 py-6 md:px-8">
        <a href={href({ name: "home" })} className="font-script text-2xl font-bold text-ink">
          System design
        </a>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 md:grid md:grid-cols-[14rem_1fr] md:px-8">
        <aside data-testid="sidebar" aria-label="Lessons" className="hidden md:block">
          <Sidebar collapsible="none" className="w-full">
            <SidebarContent>
              {curriculum.tracks.map((track) => (
                <SidebarGroup key={track.id}>
                  <SidebarGroupLabel>{track.title}</SidebarGroupLabel>
                  <SidebarMenu>
                    {track.lessons.map((lesson) => (
                      <SidebarMenuItem key={lesson.slug}>
                        <SidebarMenuButton asChild isActive={route.name === "lesson" && route.slug === lesson.slug}>
                          <a href={href({ name: "lesson", slug: lesson.slug })}>{lesson.title}</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </aside>
        <main data-testid="page" className="min-w-0">
          <Paper stock="paper" as="article" className="px-6 py-8 md:px-10 md:py-12">
            {children}
          </Paper>
        </main>
      </div>
    </SidebarProvider>
  )
}
