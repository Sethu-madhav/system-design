// src/content/content.test.ts
//
// Runs as part of `pnpm build`:
//   "build": "tsc -b && vitest run src/content && vite build"
// tsc catches the typed rules (adapted-from-link-only, cue/replay typos, unknown
// track). This file catches the rules types cannot hold, across every lesson the
// glob finds. A new lesson is covered without editing this file.

import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { curriculum } from "./curriculum"
import { SOURCES, parseSourcesTable } from "./sources"
import { lintLayout } from "@/scene/layout" // allowed: tests are exempt from boundaries

describe("sources registry", () => {
  it("matches the table in docs/sources.md, repo for repo and rule for rule", () => {
    const doc = parseSourcesTable(readFileSync("docs/sources.md", "utf8"))
    expect(new Map(Object.entries(SOURCES).map(([k, v]) => [k, v.rule]))).toEqual(doc)
  })
  it("every adapt repo has a licenseUrl", () => {
    // TODO
  })
})

describe.each(curriculum.flat.map((l) => [l.slug, l] as const))("lesson %s", (_slug, lesson) => {
  it("adapted sources name only adapt repos (runtime re-check against casts)", () => {
    for (const s of lesson.sources) if (s.use === "adapted") expect(SOURCES[s.repo].rule).toBe("adapt")
  })
  it("link sources with a repo point inside that repo's url", () => {
    // TODO
  })
  it("scene layout: no edge crosses a node, all nodes on the grid", () => {
    expect(lintLayout(lesson.timeline)).toEqual([])
  })
  it("every scene step is cued in the text at least once", () => {
    // TODO: set(lesson.body.cues) ⊇ steps.map(id) except steps[0]
  })
  it("has a summary under 160 chars and at least 3 quiz questions", () => {
    // TODO
  })
})

it("orders are unique within each track", () => {
  // TODO (buildCurriculum already throws; this names the offender)
})
