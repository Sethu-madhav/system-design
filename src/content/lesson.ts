import { compile, type Scene, type Timeline } from "@/scene"
import { makeCue, type Block, type CueFn, type Prose } from "./prose"
import { checkQuiz, type Quiz } from "./quiz"
import { attribution, type Attribution, type SourceRef, type Sources } from "./sources"
import type { TrackId } from "./curriculum"

export interface LessonInput<N extends string, S extends string> {
  readonly title: string
  readonly summary: string
  readonly track: TrackId
  readonly order: number
  readonly sources: Sources
  readonly tags?: readonly string[]
  readonly scene: Scene<N, S>
  readonly body: (kit: { readonly cue: CueFn<S> }) => Prose
  readonly quiz: Quiz<NoInfer<S>>
}

export interface LessonDraft {
  readonly title: string
  readonly summary: string
  readonly track: TrackId
  readonly order: number
  readonly tags: readonly string[]
  readonly sources: Sources
  readonly body: Prose
  readonly timeline: Timeline
  readonly quiz: Quiz
}

export interface Lesson extends LessonDraft {
  readonly slug: string
  readonly minutes: number
  readonly attributions: readonly Attribution[]
  readonly furtherReading: readonly Extract<SourceRef, { use: "link" }>[]
  readonly headings: readonly Extract<Block, { t: "h" }>[]
}

export function defineLesson<N extends string, S extends string>(input: LessonInput<N, S>): LessonDraft {
  const { scene, body, tags, ...rest } = input
  const timeline = compile(scene)
  const builtBody = body({ cue: makeCue<S>() })
  const problems = checkQuiz(input.quiz)

  if (problems.length > 0) {
    throw new Error(`lesson "${input.title}": ${problems.join("; ")}`)
  }

  return {
    ...rest,
    tags: tags ?? [],
    body: builtBody,
    timeline,
  }
}

export function finishLesson(slug: string, draft: LessonDraft): Lesson {
  return {
    ...draft,
    slug,
    minutes: Math.max(1, Math.ceil(draft.body.words / 200 + draft.timeline.duration / 60000)),
    attributions: draft.sources
      .filter((source): source is Extract<SourceRef, { use: "adapted" }> => source.use === "adapted")
      .map((source) => attribution(source)),
    furtherReading: draft.sources.filter(
      (source): source is Extract<SourceRef, { use: "link" }> => source.use === "link",
    ),
    headings: draft.body.blocks.filter((block): block is Extract<Block, { t: "h" }> => block.t === "h"),
  }
}
