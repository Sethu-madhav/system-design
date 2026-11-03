import type { EdgeId } from "./model"
import type { Timeline } from "./timeline"

export const GRID_COLS = 8
export const GRID_ROWS = 5
export const NODE_W = 0.78
export const NODE_H = 0.52
export const CELL_STEP = 8
export const MIN_CELL = 64
export const MAX_CELL = 128
export const EDGE_GAP = 6
export const EDGE_PAD = 8

export interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface EdgeGeom { readonly id: EdgeId; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number; readonly host: Rect }
export interface Layout {
  readonly cellPx: number
  readonly width: number
  readonly height: number
  readonly nodes: Readonly<Record<string, Rect>>
  readonly edges: Readonly<Record<EdgeId, EdgeGeom>>
}

export function gridOf(timeline: Timeline): { readonly cols: number; readonly rows: number } {
  return Object.values(timeline.nodes).reduce((grid, node) => ({
    cols: Math.max(grid.cols, node.at[0] + 1),
    rows: Math.max(grid.rows, node.at[1] + 1),
  }), { cols: 0, rows: 0 })
}

export function layoutScene(timeline: Timeline, width: number): Layout {
  const { cols, rows } = gridOf(timeline)
  const cellPx = Math.min(MAX_CELL, Math.max(MIN_CELL, Math.floor(width / cols / CELL_STEP) * CELL_STEP))
  const w = Math.round(NODE_W * cellPx / 4) * 4
  const h = Math.round(NODE_H * cellPx / 2) * 2
  const nodes: Record<string, Rect> = {}
  for (const [id, def] of Object.entries(timeline.nodes)) {
    const [col, row] = def.at
    nodes[id] = { x: col * cellPx + (cellPx - w) / 2, y: row * cellPx + (cellPx - h) / 2, w, h }
  }
  const edges: Record<EdgeId, EdgeGeom> = {}
  for (const edge of timeline.edges) {
    const a = nodes[edge.a]
    const b = nodes[edge.b]
    const ax = a.x + a.w / 2
    const ay = a.y + a.h / 2
    const bx = b.x + b.w / 2
    const by = b.y + b.h / 2
    const dx = bx - ax
    const dy = by - ay
    const length = Math.hypot(dx, dy)
    const tx = dx / length
    const ty = dy / length
    const ta = Math.min(dx === 0 ? Infinity : a.w / 2 / Math.abs(dx), dy === 0 ? Infinity : a.h / 2 / Math.abs(dy))
    const tb = Math.min(dx === 0 ? Infinity : b.w / 2 / Math.abs(dx), dy === 0 ? Infinity : b.h / 2 / Math.abs(dy))
    const x1 = Math.round(ax + dx * ta + tx * EDGE_GAP)
    const y1 = Math.round(ay + dy * ta + ty * EDGE_GAP)
    const x2 = Math.round(bx - dx * tb - tx * EDGE_GAP)
    const y2 = Math.round(by - dy * tb - ty * EDGE_GAP)
    const left = Math.min(x1, x2) - EDGE_PAD
    const top = Math.min(y1, y2) - EDGE_PAD
    const right = Math.max(x1, x2) + EDGE_PAD
    const bottom = Math.max(y1, y2) + EDGE_PAD
    edges[edge.id] = { id: edge.id, x1, y1, x2, y2, host: { x: left, y: top, w: Math.ceil((right - left) / 4) * 4, h: Math.ceil((bottom - top) / 2) * 2 } }
  }
  return { cellPx, width: cols * cellPx, height: rows * cellPx, nodes, edges }
}

export function pointOn(g: EdgeGeom, fromIsA: boolean, u: number): readonly [number, number] {
  const t = fromIsA ? u : 1 - u
  return [g.x1 + (g.x2 - g.x1) * t, g.y1 + (g.y2 - g.y1) * t]
}

function crosses(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): boolean {
  let t0 = 0
  let t1 = 1
  const dx = bx - ax
  const dy = by - ay
  const checks = [
    [-dx, ax - minX],
    [dx, maxX - ax],
    [-dy, ay - minY],
    [dy, maxY - ay],
  ]

  for (const check of checks) {
    const p = check[0]
    const q = check[1]
    if (p === 0) {
      if (q < 0) return false
    } else {
      const r = q / p
      if (p < 0) {
        if (r > t1) return false
        if (r > t0) t0 = r
      } else {
        if (r < t0) return false
        if (r < t1) t1 = r
      }
    }
  }

  return t0 <= t1
}

export function lintLayout(timeline: Timeline): readonly string[] {
  const problems: string[] = []
  const ids = Object.keys(timeline.nodes)

  for (const id of ids) {
    const [col, row] = timeline.nodes[id].at
    if (col >= GRID_COLS || row >= GRID_ROWS) problems.push(`${id} is outside the grid`)
  }

  for (const edge of timeline.edges) {
    const a = timeline.nodes[edge.a].at
    const b = timeline.nodes[edge.b].at
    const ax = a[0] + 0.5
    const ay = a[1] + 0.5
    const bx = b[0] + 0.5
    const by = b[1] + 0.5

    for (const id of ids) {
      if (id === edge.a || id === edge.b) continue
      const [col, row] = timeline.nodes[id].at
      const cx = col + 0.5
      const cy = row + 0.5
      if (
        crosses(ax, ay, bx, by, cx - NODE_W / 2, cx + NODE_W / 2, cy - NODE_H / 2, cy + NODE_H / 2)
      ) {
        problems.push(`edge ${edge.id} crosses ${id}`)
      }
    }
  }

  return problems
}
