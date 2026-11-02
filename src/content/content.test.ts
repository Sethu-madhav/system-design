import { describe, expect, test } from "vitest"
import { curriculum } from "./curriculum"
import { SOURCES } from "./sources"
import { lintLayout } from "@/scene/layout"

describe.each(curriculum.flat.map((lesson) => [lesson.slug, lesson] as const))(
  "lesson %s",
  (_slug, lesson) => {
    test("adapted sources name only adapt repos", () => {
      for (const source of lesson.sources) {
        if (source.use === "adapted") expect(SOURCES[source.repo].rule).toBe("adapt")
      }
    })

    test("link sources with a repo point inside that repo's url", () => {
      for (const source of lesson.sources) {
        if (source.use === "link" && source.repo !== undefined) {
          expect(source.url.startsWith(SOURCES[source.repo].url)).toBe(true)
        }
      }
    })

    test("scene layout: no edge crosses a node, all nodes on the grid", () => {
      expect(lintLayout(lesson.timeline)).toEqual([])
    })

    test("every scene step except the first is cued in the text", () => {
      for (const step of lesson.timeline.steps.slice(1)) {
        expect(lesson.body.cues).toContain(step.id)
      }
    })

    test("has a summary under 160 chars and at least 3 quiz questions", () => {
      expect(lesson.summary.length).toBeLessThan(160)
      expect(lesson.quiz.length).toBeGreaterThanOrEqual(3)
    })
  },
)
