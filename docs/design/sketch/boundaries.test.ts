// src/boundaries.test.ts
//
// Makes internals unreachable: TypeScript cannot hide a file, so this test scans
// imports and fails `pnpm test` on any of:
//   - a file outside src/<mod>/ importing "@/<mod>/<anything>" for mod in
//     content, scene, progress, search (must import "@/<mod>"). *.test.ts exempt.
//   - a lesson file (src/content/lessons/**) importing anything except "@/content/author".
//   - a file in src/scene importing "@/content" (scene must not know lessons).
//   - defineRecipe called anywhere but at module top level of src/scene/ink.ts or src/lib/ink/recipes/*.

import { it } from "vitest"

it("module boundaries hold", () => {
  // TODO: glob src/**/*.{ts,tsx}, regex import specifiers, check the rules, list all offenders.
  throw new Error("not implemented")
})
