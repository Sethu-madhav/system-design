// src/scene/layout.ts
//
// Owns: geometry. Grid cells -> pixel rects for a given stage width, edge
// endpoints clipped to node rects, and points along an edge for packets. Pure.
//
// Ink-cache rule: every number that reaches a recipe's params or a host's size is
// an integer derived from (scene, cellPx), and cellPx is bucketed to CELL_STEP.
// So a given scene at a given width bucket produces the same params every time,
// and resizing within a bucket or playing the scene never misses the ink cache.

import type { EdgeId } from "./model"
import type { Timeline } from "./timeline"

export const CELL_STEP = 8
export const MIN_CELL = 88
export const MAX_CELL = 168
/** Node box as a fraction of a cell. */
export const NODE_W = 0.78
export const NODE_H = 0.52

export interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface EdgeGeom {
  readonly id: EdgeId
  /** Endpoints in stage px, clipped to the node rects plus a gap. Integers. */
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  /** Host rect for the edge's ink (bounding box + pad). */
  readonly host: Rect
}

export interface Layout {
  readonly cellPx: number
  readonly width: number
  readonly height: number
  readonly nodes: Readonly<Record<string, Rect>>
  readonly edges: Readonly<Record<EdgeId, EdgeGeom>>
}

/** cols = max col + 1; cellPx = bucket(clamp(width / cols)). */
export function layoutScene(_tl: Timeline, _width: number): Layout {
  throw new Error("not implemented")
}

/** Point at u in [0, 1] from `from` to `to` along the edge (reverses when from is b). */
export function pointOn(_g: EdgeGeom, _fromIsA: boolean, _u: number): readonly [number, number] {
  throw new Error("not implemented")
}

/**
 * Layout lint for content.test.ts: an edge whose straight segment crosses a third
 * node's rect, or a node outside 0..7 cols / 0..4 rows. Returns messages.
 */
export function lintLayout(_tl: Timeline): readonly string[] {
  throw new Error("not implemented")
}
