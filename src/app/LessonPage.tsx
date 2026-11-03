import { useEffect } from "react"
import { H1, H2 } from "@/components/ui/typography"
import { curriculum, neighbors } from "@/content"
import { href, type LessonRoute } from "@/app/routes"
import { NotFoundPage } from "@/app/NotFoundPage"
import { ProseView } from "@/app/ProseView"
import { SceneProvider, ScenePlayer } from "@/scene"

export function LessonPage({ route }: { route: LessonRoute }) {
  const lesson = curriculum.bySlug.get(route.slug)

  useEffect(() => {
    if (route.section) {
      document.getElementById(route.section)?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [route.section, lesson])

  if (!lesson) {
    return <NotFoundPage path={href(route).slice(1)} />
  }

  const track = curriculum.tracks.find((item) => item.id === lesson.track)
  const lessonNeighbors = neighbors(curriculum, lesson.slug)

  return (
    <SceneProvider key={lesson.slug} timeline={lesson.timeline}>
      <div data-testid="lesson" data-slug={lesson.slug} className="space-y-8">
        <header className="space-y-3">
          <H1>{lesson.title}</H1>
          <p className="font-hand text-lg text-pencil-text">{track?.title} · {lesson.minutes} min</p>
        </header>
        <ScenePlayer />
        <div className="min-w-0 space-y-8">
          <ProseView prose={lesson.body} />
          <section data-testid="attribution" className="space-y-2">
            <H2>Attribution</H2>
            {lesson.attributions.map((item) => (
              <p key={item.sourceUrl} className="font-hand text-base">
                <a href={item.sourceUrl}>{item.text}</a>{" "}
                Licensed under <a href={item.licenseUrl}>{item.license}</a>. {item.changed}
              </p>
            ))}
          </section>
          <section data-testid="further-reading" className="space-y-2">
            <H2>Further reading</H2>
            <ul className="list-disc space-y-1 ps-6">
              {lesson.furtherReading.map((item) => <li key={item.url}><a href={item.url}>{item.title}</a></li>)}
            </ul>
          </section>
          <nav aria-label="Lesson navigation" className="flex justify-between gap-4 font-hand text-lg">
            {lessonNeighbors.prev ? <a href={href({ name: "lesson", slug: lessonNeighbors.prev.slug })}>← {lessonNeighbors.prev.title}</a> : <span />}
            {lessonNeighbors.next ? <a href={href({ name: "lesson", slug: lessonNeighbors.next.slug })}>{lessonNeighbors.next.title} →</a> : null}
          </nav>
        </div>
      </div>
    </SceneProvider>
  )
}
