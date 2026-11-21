import { useCallback, useEffect } from "react"
import { H1, H2 } from "@/components/ui/typography"
import { blockText, curriculum, neighbors } from "@/content"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { href, type LessonRoute } from "@/app/routes"
import { LINK_CLASS, TOC_LINK_CLASS } from "@/app/link-class"
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
    const section = route.section
    if (!section) {
      window.scrollTo(0, 0)
      return
    }
    const scroll = () => document.getElementById(section)?.scrollIntoView()
    scroll()
    let current = true
    void document.fonts.ready.then(() => {
      if (current) scroll()
    })
    return () => {
      current = false
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
          <ol className="space-y-1 font-hand">
            {tocNumbers(lesson.headings).map(({ heading, number }) => (
              <li key={heading.id} className={heading.level === 3 ? "flex gap-2 ps-4" : "flex gap-2"}>
                <span aria-hidden="true" className="min-w-[3ch] shrink-0 text-end tabular-nums text-pencil-text">{number}</span>
                <a data-toc={heading.id} href={href({ name: "lesson", slug: lesson.slug, section: heading.id })} className={TOC_LINK_CLASS}>{blockText(heading)}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-3">
          <ProseView prose={lesson.body} />
          <QuizView slug={lesson.slug} quiz={lesson.quiz} />
          <section data-testid="further-reading" className="space-y-2">
            <H2>Further reading</H2>
            <ul className="list-disc space-y-1 ps-6">
              {lesson.sources.map((item) => <li key={item.url}><a href={item.url} className={LINK_CLASS}>{item.title}</a></li>)}
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

function tocNumbers<H extends { level: number }>(headings: readonly H[]) {
  let section = 0
  let sub = 0
  return headings.map((heading) => {
    if (heading.level === 3) {
      sub += 1
      return { heading, number: `${section}.${sub}` }
    }
    section += 1
    sub = 0
    return { heading, number: `${section}.` }
  })
}
