import { useCallback, useEffect } from "react"
import { H1, H2 } from "@/components/ui/typography"
import { blockText, curriculum, neighbors } from "@/content"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { href, type LessonRoute } from "@/app/routes"
import { LINK_CLASS } from "@/app/link-class"
import { NotFoundPage } from "@/app/NotFoundPage"
import { ProseView } from "@/app/ProseView"
import { QuizView } from "@/app/QuizView"
import { SceneProvider, ScenePlayer } from "@/scene"
import { useProgress } from "@/progress"

export function LessonPage({ route }: { route: LessonRoute }) {
  const lesson = curriculum.bySlug.get(route.slug)
  const { record } = useProgress()
  const slug = lesson?.slug

  useEffect(() => {
    if (lesson !== undefined) record({ kind: "opened", slug: lesson.slug, at: Date.now() })
  }, [lesson, record])

  const onEnd = useCallback(() => {
    if (slug !== undefined) record({ kind: "scene-done", slug, at: Date.now() })
  }, [record, slug])

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
    <SceneProvider key={lesson.slug} timeline={lesson.timeline} step={route.step} onEnd={onEnd}>
      <div data-testid="lesson" data-slug={lesson.slug} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <header className="space-y-3 lg:col-span-2">
          <Breadcrumb data-testid="breadcrumb">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href={href({ name: "home" })}>Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{track?.title}</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{lesson.title}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <H1>{lesson.title}</H1>
          <p className="font-hand text-lg text-pencil-text">{lesson.minutes} min read</p>
        </header>
        <div className="lg:col-span-2"><ScenePlayer /></div>
        <nav data-testid="toc" aria-label="On this page" className="hidden self-start lg:sticky lg:top-6 lg:col-start-2 lg:row-start-3 lg:block">
          <p className="font-hand text-base text-pencil-text">On this page</p>
          <ul className="space-y-1 font-hand">
            {lesson.headings.map((heading) => (
              <li key={heading.id} className={heading.level === 3 ? "ps-4" : undefined}>
                <a data-toc={heading.id} href={href({ name: "lesson", slug: lesson.slug, section: heading.id })}>{blockText(heading)}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-3">
          <ProseView prose={lesson.body} />
          <QuizView slug={lesson.slug} quiz={lesson.quiz} />
          <section data-testid="attribution" className="space-y-2">
            <H2>Attribution</H2>
            {lesson.attributions.map((item) => (
              <p key={item.sourceUrl} className="font-hand text-base">
                <a href={item.sourceUrl} className={LINK_CLASS}>{item.text}</a>{" "}
                Licensed under <a href={item.licenseUrl} className={LINK_CLASS}>{item.license}</a>. {item.changed}
              </p>
            ))}
          </section>
          <section data-testid="further-reading" className="space-y-2">
            <H2>Further reading</H2>
            <ul className="list-disc space-y-1 ps-6">
              {lesson.furtherReading.map((item) => <li key={item.url}><a href={item.url} className={LINK_CLASS}>{item.title}</a></li>)}
            </ul>
          </section>
          <nav data-testid="lesson-nav" aria-label="Lesson navigation" className="flex justify-between gap-4 font-hand text-lg">
            {lessonNeighbors.prev ? <a href={href({ name: "lesson", slug: lessonNeighbors.prev.slug })} className={LINK_CLASS}>← {lessonNeighbors.prev.title}</a> : <span />}
            {lessonNeighbors.next ? <a href={href({ name: "lesson", slug: lessonNeighbors.next.slug })} className={LINK_CLASS}>{lessonNeighbors.next.title} →</a> : null}
          </nav>
        </div>
      </div>
    </SceneProvider>
  )
}
