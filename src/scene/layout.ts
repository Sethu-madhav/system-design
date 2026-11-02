import type { Timeline } from "./timeline"

export const GRID_COLS = 8
export const GRID_ROWS = 5
export const NODE_W = 0.78
export const NODE_H = 0.52

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
