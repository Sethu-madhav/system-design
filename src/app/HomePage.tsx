import { H1, H2 } from "@/components/ui/typography"
import { IndexCard, IndexCardContent, IndexCardFooter, IndexCardTitle } from "@/components/ui/index-card"
import { curriculum } from "@/content"
import { href } from "@/app/routes"

export function HomePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <H1>Learn system design</H1>
        <p className="font-hand text-lg text-pencil-text">
          Read a lesson, watch the system move, then check yourself with a short quiz.
        </p>
      </header>
      {curriculum.tracks.map((track) => (
        <section key={track.id} data-testid="track" data-track={track.id} className="space-y-4">
          <H2>{track.title}</H2>
          <div className="flex flex-wrap gap-5">
            {track.lessons.map((lesson) => (
              <a key={lesson.slug} href={href({ name: "lesson", slug: lesson.slug })} data-testid="lesson-card" data-slug={lesson.slug} className="block w-full max-w-md focus-visible:outline-2 focus-visible:outline-offset-4">
                <IndexCard>
                  <IndexCardTitle>{lesson.title}</IndexCardTitle>
                  <IndexCardContent>{lesson.summary}</IndexCardContent>
                  <IndexCardFooter>{lesson.minutes} min</IndexCardFooter>
                </IndexCard>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
