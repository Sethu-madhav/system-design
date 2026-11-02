// src/content/author.ts
//
// The authoring surface. A lesson file imports from here and nowhere else
// (boundaries.test.ts enforces it), so the example lesson is the whole manual.

export { defineLesson } from "./lesson"
export { md } from "./prose"
export { defineScene } from "@/scene"
