import { H1, H2 } from "@/components/ui/typography"
import { IndexCard, IndexCardContent, IndexCardFooter, IndexCardHeader, IndexCardTitle } from "@/components/ui/index-card"
import { curriculum } from "@/content"
import { href } from "@/app/routes"
import { useProgress } from "@/progress"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function HomePage() {
  const { summary, status, clear } = useProgress()
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <H1>Learn system design</H1>
        <p className="font-hand text-lg text-pencil-text">
          Read a lesson, watch the system move, then check yourself with a short quiz.
        </p>
      </header>
      <section data-testid="progress-summary" className="space-y-4">
        <p data-testid="progress-count">{summary.done} of {summary.total} lessons done</p>
        <Progress value={summary.done} max={summary.total} aria-label="Lessons done" />
        {summary.nextSlug !== undefined ? (
          <a
            data-testid="next-lesson"
            data-slug={summary.nextSlug}
            data-status={status(summary.nextSlug)}
            href={href({ name: "lesson", slug: summary.nextSlug })}
            className="block max-w-md"
          >
            <Card className="p-5">
              <p className="font-hand text-sm text-pencil-text">{status(summary.nextSlug) === "new" ? "Start here" : "Continue"}</p>
              <p className="font-script text-2xl font-bold">{curriculum.bySlug.get(summary.nextSlug)?.title}</p>
            </Card>
          </a>
        ) : <p data-testid="all-done">You finished every lesson.</p>}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Reset progress</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset progress?</AlertDialogTitle>
              <AlertDialogDescription>This clears every mark and quiz score saved in this browser.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clear}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
      {curriculum.tracks.map((track) => (
        <section key={track.id} data-testid="track" data-track={track.id} className="space-y-4">
          <H2>{track.title}</H2>
          <div className="flex flex-wrap gap-5">
            {track.lessons.map((lesson) => (
              <a key={lesson.slug} href={href({ name: "lesson", slug: lesson.slug })} data-testid="lesson-card" data-slug={lesson.slug} className="block w-full max-w-md focus-visible:outline-2 focus-visible:outline-offset-4">
                <IndexCard>
                  <IndexCardHeader>
                    <IndexCardTitle>{lesson.title}</IndexCardTitle>
                  </IndexCardHeader>
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
