// src/scene/index.ts — the only import path into src/scene from outside it.
// boundaries.test.ts fails if any file outside src/scene imports "@/scene/<file>".
// Lesson files do not import this; they get defineScene from "@/content/author".

export { defineScene } from "./model"
export type { Scene, NodeKind, NodeDef, PacketTone } from "./model"
export { compile, SceneError } from "./timeline"
export type { Timeline } from "./timeline"
export { SceneProvider, ScenePlayer, useSceneCue } from "./ScenePlayer"
