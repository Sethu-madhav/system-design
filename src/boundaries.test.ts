import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import ts from "typescript"
import { expect, test } from "vitest"

interface FileText {
  readonly path: string
  readonly text: string
}

const MODULES = ["content", "scene", "progress", "search", "theme"] as const
type ModuleName = (typeof MODULES)[number]

function moduleOf(target: string): ModuleName | undefined {
  for (const name of MODULES) {
    if (target === `src/${name}` || target.startsWith(`src/${name}/`)) return name
  }
  return undefined
}

function resolveTarget(file: string, spec: string): string | undefined {
  let target: string

  if (spec.startsWith("@/")) {
    target = `src/${spec.slice(2)}`
  } else if (spec.startsWith("./") || spec.startsWith("../")) {
    target = path.posix.join(path.posix.dirname(file), spec)
  } else {
    return undefined
  }

  target = target.replace(/\.(?:ts|tsx)$/, "")
  return target.replace(/\/index$/, "")
}

function findViolations(files: readonly FileText[]): string[] {
  const violations: string[] = []

  for (const file of files) {
    const fileModule = moduleOf(file.path)
    const isTest = file.path.endsWith(".test.ts")
    const isLesson = file.path.startsWith("src/content/lessons/")

    const imports = ts.preProcessFile(file.text, true, true).importedFiles.map((f) => f.fileName)

    for (const spec of imports) {
      const target = resolveTarget(file.path, spec)
      const targetModule = target === undefined ? undefined : moduleOf(target)

      if (
        !isTest &&
        targetModule !== undefined &&
        fileModule !== targetModule &&
        target !== `src/${targetModule}`
      ) {
        violations.push(`${file.path} imports ${spec}, use @/${targetModule}`)
      }

      if (isLesson && spec !== "@/content/author") {
        violations.push(`${file.path} is a lesson and may only import @/content/author, not ${spec}`)
      }

      if (fileModule === "scene" && !isTest && targetModule === "content") {
        violations.push(`${file.path} is in src/scene and imports ${spec} from src/content`)
      }
    }

    if (!isTest) {
      for (const line of file.text.split("\n")) {
        if (!/\bdefineRecipe\s*[<(]/.test(line) || line.includes("function defineRecipe")) continue

        const allowedPath =
          file.path === "src/scene/ink.ts" || /^src\/lib\/ink\/recipes\/[^/]+\.ts$/.test(file.path)
        const allowedLine = /^(export )?const \w+ = defineRecipe\b/.test(line)

        if (!(allowedPath && allowedLine)) {
          violations.push(`${file.path} calls defineRecipe outside a top-level ink recipe`)
        }
      }
    }
  }

  return violations
}

test("module boundaries hold", () => {
  const files = readdirSync("src", { recursive: true, encoding: "utf8" })
    .filter((entry) => entry.endsWith(".ts") || entry.endsWith(".tsx"))
    .map((entry) => ({ path: `src/${entry}`, text: readFileSync(path.join("src", entry), "utf8") }))

  expect(findViolations(files)).toEqual([])
})

test("a planted bad import in a temp string is reported", () => {
  const files = [{ path: "src/app/x.tsx", text: 'import { compile } from "@/scene/timeline"' }]

  expect(findViolations(files)).toEqual([
    "src/app/x.tsx imports @/scene/timeline, use @/scene",
  ])
})

test("relative import into another module is reported", () => {
  const files = [{ path: "src/app/x.tsx", text: 'import { md } from "../content/prose"' }]

  expect(findViolations(files)).toEqual(["src/app/x.tsx imports ../content/prose, use @/content"])
})

test("index imports and test files are allowed", () => {
  const files = [
    {
      path: "src/app/x.tsx",
      text: 'import { curriculum } from "@/content"\nimport { compile } from "@/scene"\nimport { md } from "../scene/index"',
    },
    { path: "src/app/x.test.ts", text: 'import { compile } from "@/scene/timeline"' },
  ]

  expect(findViolations(files)).toEqual([])
})

test("lesson file importing anything but @/content/author is reported", () => {
  const files = [
    {
      path: "src/content/lessons/x/lesson.ts",
      text: 'import { defineLesson } from "@/content/author"\nimport { useState } from "react"',
    },
  ]

  expect(findViolations(files)).toEqual([
    "src/content/lessons/x/lesson.ts is a lesson and may only import @/content/author, not react",
  ])

  expect(
    findViolations([
      {
        path: "src/content/lessons/x/lesson.ts",
        text: 'import { md } from "@/content/author"\nconst b = md`This comes from "Some Book".`',
      },
    ]),
  ).toEqual([])
})

test("scene importing content is reported", () => {
  const files = [{ path: "src/scene/x.ts", text: 'import { md } from "@/content"' }]

  expect(findViolations(files)).toEqual([
    "src/scene/x.ts is in src/scene and imports @/content from src/content",
  ])
})

test("defineRecipe outside a top-level ink recipe is reported", () => {
  const message = "src/app/x.tsx calls defineRecipe outside a top-level ink recipe"

  expect(
    findViolations([
      { path: "src/lib/ink/recipes/x.ts", text: "export const r = defineRecipe({" },
    ]),
  ).toEqual([])

  expect(
    findViolations([{ path: "src/lib/ink/recipes/x.ts", text: "  const r = defineRecipe({" }]),
  ).toEqual(["src/lib/ink/recipes/x.ts calls defineRecipe outside a top-level ink recipe"])

  expect(findViolations([{ path: "src/app/x.tsx", text: "const r = defineRecipe({" }])).toEqual([
    message,
  ])
})

test("one import can break two rules", () => {
  const files = [
    {
      path: "src/content/lessons/x/lesson.ts",
      text: 'import { compile } from "@/scene/model"',
    },
  ]

  expect(findViolations(files)).toEqual([
    "src/content/lessons/x/lesson.ts imports @/scene/model, use @/scene",
    "src/content/lessons/x/lesson.ts is a lesson and may only import @/content/author, not @/scene/model",
  ])
})
