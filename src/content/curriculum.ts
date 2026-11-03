import { finishLesson, type Lesson, type LessonDraft } from "./lesson"

export const TRACKS = [
  { id: "foundations", title: "Foundations" },
  { id: "estimation", title: "Back of the envelope" },
  { id: "network", title: "The path of a request" },
  { id: "edge", title: "Edge and traffic" },
  { id: "application", title: "Application services" },
  { id: "data", title: "Databases" },
  { id: "cache", title: "Caching" },
  { id: "async", title: "Asynchronous work" },
  { id: "distributed", title: "Distributed systems" },
  { id: "operations", title: "Running in production" },
  { id: "security", title: "Security" },
  { id: "case-studies", title: "Case studies" },
] as const

export type TrackId = (typeof TRACKS)[number]["id"]

export interface Track {
  readonly id: TrackId
  readonly title: string
  readonly lessons: readonly Lesson[]
}

export interface Curriculum {
  readonly tracks: readonly Track[]
  readonly flat: readonly Lesson[]
  readonly bySlug: ReadonlyMap<string, Lesson>
}

export interface Neighbors {
  readonly prev?: Lesson
  readonly next?: Lesson
}

export function buildCurriculum(
  modules: Record<string, { readonly default?: LessonDraft }>,
): Curriculum {
  const lessons: Lesson[] = []

  for (const key of Object.keys(modules)) {
    const match = /^\.\/lessons\/([^/]+)\/lesson\.ts$/.exec(key)
    if (match === null) throw new Error(`unexpected lesson path ${key}`)

    const slug = match[1]
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`lesson folder ${slug} is not kebab-case`)
    }

    const draft = modules[key].default
    if (draft === undefined) throw new Error(`${key} has no default export`)

    lessons.push(finishLesson(slug, draft))
  }

  const tracks: Track[] = []

  for (const track of TRACKS) {
    const own = lessons.filter((lesson) => lesson.track === track.id).sort((a, b) => a.order - b.order)

    for (let index = 1; index < own.length; index += 1) {
      const previous = own[index - 1]
      const current = own[index]
      if (previous.order === current.order) {
        throw new Error(
          `${previous.slug} and ${current.slug} share order ${previous.order} in track ${track.id}`,
        )
      }
    }

    if (own.length > 0) tracks.push({ id: track.id, title: track.title, lessons: own })
  }

  const flat = tracks.flatMap((track) => track.lessons)
  const bySlug = new Map(flat.map((lesson) => [lesson.slug, lesson]))

  return { tracks, flat, bySlug }
}

export function neighbors(curriculum: Curriculum, slug: string): Neighbors {
  const index = curriculum.flat.findIndex((lesson) => lesson.slug === slug)
  if (index === -1) return {}

  const prev = curriculum.flat[index - 1]
  const next = curriculum.flat[index + 1]

  return {
    ...(prev === undefined ? {} : { prev }),
    ...(next === undefined ? {} : { next }),
  }
}

export const curriculum = buildCurriculum(
  import.meta.glob<{ readonly default: LessonDraft }>("./lessons/*/lesson.ts", { eager: true }),
)
