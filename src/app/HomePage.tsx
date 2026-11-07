import { H1, H2, H3, Lead, List, P } from "@/components/ui/typography"
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
        <Lead className="font-hand text-pencil-text">
          Short lessons on how big apps stay fast and stay up. Each one starts with a small app on one server, grows it to real scale, and ends with a quiz.
        </Lead>
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
      </section>
      <section data-testid="how-it-works" className="space-y-4">
        <H2>How a lesson works</H2>
        <div className="flex flex-wrap gap-5">
          <IndexCard className="w-full max-w-xs">
            <IndexCardHeader>
              <IndexCardTitle>Read</IndexCardTitle>
            </IndexCardHeader>
            <IndexCardContent>Every lesson opens with a problem, such as a server that hits 100% CPU every evening. The idea comes after the problem.</IndexCardContent>
          </IndexCard>
          <IndexCard className="w-full max-w-xs">
            <IndexCardHeader>
              <IndexCardTitle>Watch</IndexCardTitle>
            </IndexCardHeader>
            <IndexCardContent>A diagram moves as you read. Each step shows one request, one failure or one fix.</IndexCardContent>
          </IndexCard>
          <IndexCard className="w-full max-w-xs">
            <IndexCardHeader>
              <IndexCardTitle>Check</IndexCardTitle>
            </IndexCardHeader>
            <IndexCardContent>A short quiz ends the lesson. Pass it and the lesson is marked done on this device.</IndexCardContent>
          </IndexCard>
        </div>
      </section>
      <section data-testid="audience" className="space-y-4">
        <H2>Who it is for</H2>
        <P>You have built a web app that runs on one server. You know what HTTP, a database and a server are. You want to know why a design picks one option over another, for your job or for a system design interview.</P>
        <P>By the end of the course you can do 4 things.</P>
        <List ordered>
          <li>Turn a one-line product idea into requirements and rough numbers.</li>
          <li>Draw a first design and name its bottleneck.</li>
          <li>Pick between 2 or 3 options for each part and say what each costs.</li>
          <li>Explain how the design behaves when a machine, a network link or a whole region fails.</li>
        </List>
      </section>
      <section data-testid="lessons-intro" className="space-y-4">
        <H2>The lessons</H2>
        <P>The chapters run in order, and each one uses only ideas from the chapters before it. New lessons arrive in that order too.</P>
        {curriculum.tracks.map((track) => (
          <section key={track.id} data-testid="track" data-track={track.id} className="space-y-4">
            <H3>{track.title}</H3>
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
      </section>
      <footer className="pt-4">
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
      </footer>
    </div>
  )
}
