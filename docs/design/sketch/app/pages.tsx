// src/app/ — React shell. Sketch of the components and what each one reads.
// Each page reads @/content, @/progress, @/scene, @/search through their index
// files only. Call chain for the main flow is three files:
//   LessonPage.tsx -> @/scene (ScenePlayer.tsx) -> timeline.ts
//
// File map (one component per file in the real code):
//   src/app/App.tsx            InkProvider, Shell, route switch, <SearchPalette/>
//   src/app/Shell.tsx          Looseleaf sidebar: tracks + lessons + status dots; header with search button (Cmd-K, "/")
//   src/app/HomePage.tsx       progress summary, "continue" card, track sections with lesson index-cards
//   src/app/LessonPage.tsx     see below
//   src/app/ProseView.tsx      renders Prose AST; <Cue> uses useSceneCue
//   src/app/QuizView.tsx       one question at a time, submit -> grade -> record
//   src/app/SearchPalette.tsx  Looseleaf command (cmdk) with shouldFilter=false, results from search()
//   src/app/NotFoundPage.tsx

import type * as React from "react"
import type { Route } from "./routes"
import type { Lesson, Prose, Quiz } from "@/content"

export function App(): React.ReactElement {
  // <InkProvider><Shell>{route.name === "home" ? <HomePage/> : route.name === "lesson" ? <LessonPage route={route}/> : <NotFoundPage/>}</Shell><SearchPalette/></InkProvider>
  throw new Error("not implemented")
}

/**
 * Wide (>= 1024px): two columns, prose left, sticky ScenePlayer right.
 * Narrow: ScenePlayer above the prose, not sticky.
 *   const lesson = curriculum.bySlug.get(route.slug) ?? <NotFoundPage/>
 *   useEffect -> record({kind: "opened", slug, at})
 *   <SceneProvider key={slug} timeline={lesson.timeline} onFinish={() => record({kind: "scene-done", ...})}>
 *     header (title, track, minutes, status badge)
 *     <ScenePlayer/>            (initial step from route.step via goto)
 *     <ProseView prose={lesson.body}/>
 *     <QuizView slug quiz={lesson.quiz}/>
 *     <Attribution/> + further reading  (from lesson.attributions / furtherReading)
 *     prev / next from neighbors()
 *   </SceneProvider>
 */
export function LessonPage(_p: { route: Extract<Route, { name: "lesson" }> }): React.ReactElement {
  throw new Error("not implemented")
}

/** Cue: inline highlight (Looseleaf highlight) when active; a button that plays its step. data-cue=<step>. */
export function ProseView(_p: { prose: Prose }): React.ReactElement {
  throw new Error("not implemented")
}

/** Answers live in component state only. On submit: result = grade(quiz, answers); record quiz fact; show per-question explain + "show me" (useSceneCue(q.replay).play). Retake resets state. */
export function QuizView(_p: { slug: string; quiz: Quiz }): React.ReactElement {
  throw new Error("not implemented")
}

export function HomePage(): React.ReactElement {
  throw new Error("not implemented")
}

export type { Lesson }
