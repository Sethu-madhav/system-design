import { arrow, cross, defineRecipe, ellipsePoly, focusRing, wash, type Box, type Ink, type PaintKey, type Pt } from "@/lib/ink"
import { NODE_ROLE, type NodeKind, type NodeRole } from "./model"
import type { EdgeDef } from "./timeline"

export const ROLE_PAINT: Readonly<Record<NodeRole, PaintKey>> = {
  outside: "pencil",
  edge: "tangerine",
  compute: "grass",
  sql: "sky",
  nosql: "grape",
  cache: "tomato",
  queue: "lemon",
  storage: "teal",
}

const UNIT_W = 100
const UNIT_H = 66
const FILL_ALPHA = 0.42

interface Pad {
  fill(pts: readonly Pt[]): void
  ink(pts: readonly Pt[]): void
  pencil(pts: readonly Pt[]): void
  dot(x: number, y: number, r: number): void
  solid(pts: readonly Pt[]): void
}

function pad(ink: Ink, b: Box, color: PaintKey): Pad {
  const sx = b.w / UNIT_W
  const sy = b.h / UNIT_H
  const at = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [x * sx, y * sy])
  return {
    fill: (pts) => { wash(ink, at(pts), color, { alpha: FILL_ALPHA, material: "wash" }) },
    ink: (pts) => { ink.stroke(at(pts), "ink", { end: "soft", start: "soft" }) },
    pencil: (pts) => { ink.stroke(at(pts), "pencil", { end: "soft", start: "soft" }) },
    dot: (x, y, r) => { ink.poly("marker", ellipsePoly(x * sx, y * sy, r * sx, r * sy, 12), "ink", 0.95) },
    solid: (pts) => { ink.poly("marker", at(pts), "ink", 0.95) },
  }
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 18): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + (a1 - a0) * i / n
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]
  })
const ring = (cx: number, cy: number, rx: number, ry: number): Pt[] => arc(cx, cy, rx, ry, 0, Math.PI * 2, 28)
const seg = (x1: number, y1: number, x2: number, y2: number): Pt[] => [[x1, y1], [x2, y2]]

function gear(p: Pad, cx: number, cy: number, r: number, spoke: number) {
  p.ink(ring(cx, cy, r, r))
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4
    p.ink(seg(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + spoke), cy + Math.sin(a) * (r + spoke)))
  }
}

const CLOUD: Pt[] = [
  ...arc(30, 40, 14, 12, Math.PI * 0.5, Math.PI * 1.5),
  ...arc(48, 26, 18, 16, Math.PI * 1.1, Math.PI * 1.95),
  ...arc(70, 38, 14, 13, Math.PI * 1.4, Math.PI * 2.5),
  [30, 52],
]

export const NODE_SHAPES: Readonly<Record<NodeKind, (p: Pad) => void>> = {
  client: (p) => {
    p.fill(rect(22, 8, 56, 38))
    p.ink(rect(22, 8, 56, 38))
    p.ink([[12, 52], [88, 52], [82, 59], [18, 59], [12, 52]])
  },
  mobile: (p) => {
    p.fill(rect(38, 8, 24, 50))
    p.ink(rect(36, 4, 28, 58))
    p.ink(seg(46, 10, 54, 10))
    p.dot(50, 55, 1.8)
  },
  internet: (p) => {
    p.fill(CLOUD)
    p.ink(CLOUD)
  },
  dns: (p) => {
    const top: Pt[] = [[30, 12], [70, 12], [78, 20], [70, 28], [30, 28], [30, 12]]
    const low: Pt[] = [[70, 34], [30, 34], [22, 42], [30, 50], [70, 50], [70, 34]]
    p.fill(top)
    p.fill(low)
    p.ink(seg(50, 6, 50, 62))
    p.ink(top)
    p.ink(low)
  },
  cdn: (p) => {
    p.fill(ring(50, 33, 26, 27))
    p.ink(ring(50, 33, 26, 27))
    p.pencil(seg(24, 33, 76, 33))
    p.pencil(arc(50, 33, 11, 27, -Math.PI / 2, Math.PI / 2))
    p.pencil(arc(50, 33, 11, 27, Math.PI / 2, Math.PI * 1.5))
    p.dot(36, 20, 3)
    p.dot(65, 42, 3)
    p.dot(44, 50, 3)
  },
  lb: (p) => {
    p.fill(rect(36, 14, 28, 38))
    p.ink(rect(36, 14, 28, 38))
    p.ink(seg(6, 33, 36, 33))
    for (const y of [12, 33, 54]) {
      p.ink(seg(64, 33, 92, y))
      const dx = 92 - 64
      const dy = y - 33
      const l = Math.hypot(dx, dy)
      const ux = dx / l
      const uy = dy / l
      p.ink([[92 - ux * 7 - uy * 4, y - uy * 7 + ux * 4], [92, y], [92 - ux * 7 + uy * 4, y - uy * 7 - ux * 4]])
    }
  },
  proxy: (p) => {
    const shield: Pt[] = [[50, 5], [74, 13], [74, 31], [70, 45], [50, 61], [30, 45], [26, 31], [26, 13], [50, 5]]
    p.fill(shield)
    p.ink(shield)
    p.ink([[40, 33], [47, 40], [60, 25]])
  },
  server: (p) => {
    p.fill(rect(24, 6, 52, 54))
    p.ink(rect(24, 6, 52, 54))
    p.ink(seg(24, 24, 76, 24))
    p.ink(seg(24, 42, 76, 42))
    for (const y of [15, 33, 51]) {
      p.pencil(seg(31, y, 54, y))
      p.dot(68, y, 2.6)
    }
  },
  service: (p) => {
    p.fill(rect(20, 8, 60, 50))
    p.ink(rect(20, 8, 60, 50))
    gear(p, 50, 33, 9, 6)
  },
  worker: (p) => {
    p.fill(ring(50, 33, 20, 20))
    gear(p, 50, 33, 20, 6)
    p.ink(ring(50, 33, 7, 7))
    p.pencil(arc(50, 33, 33, 28, -Math.PI * 0.3, Math.PI * 0.3))
  },
  cache: (p) => {
    p.fill(rect(16, 16, 68, 34))
    p.ink(rect(16, 16, 68, 34))
    for (const x of [25, 38, 50, 62, 75]) {
      p.pencil(seg(x, 16, x, 8))
      p.pencil(seg(x, 50, x, 58))
    }
    p.solid([[54, 20], [42, 35], [50, 35], [45, 47], [58, 30], [50, 30], [54, 20]])
  },
  db: (p) => {
    const body: Pt[] = [[24, 12], ...arc(50, 54, 26, 7, Math.PI, 0), [76, 12]]
    p.fill([...body, [24, 12]])
    p.ink(ring(50, 12, 26, 7))
    p.ink([[24, 12], [24, 54]])
    p.ink([[76, 12], [76, 54]])
    p.ink(arc(50, 54, 26, 7, 0, Math.PI))
    p.pencil(arc(50, 26, 26, 7, 0, Math.PI))
    p.pencil(arc(50, 40, 26, 7, 0, Math.PI))
  },
  nosql: (p) => {
    p.fill(rect(30, 16, 36, 44))
    p.ink([[38, 6], [74, 6], [74, 50]])
    p.ink([[34, 11], [70, 11], [70, 55]])
    p.ink(rect(30, 16, 36, 44))
    p.ink([[44, 26], [41, 27], [41, 36], [38, 38], [41, 40], [41, 49], [44, 50]])
    p.ink([[52, 26], [55, 27], [55, 36], [58, 38], [55, 40], [55, 49], [52, 50]])
  },
  queue: (p) => {
    p.fill(rect(8, 18, 74, 30))
    p.ink(seg(8, 18, 82, 18))
    p.ink(seg(8, 48, 82, 48))
    for (const x of [14, 36, 58]) p.ink(rect(x, 24, 16, 18))
    p.ink(seg(84, 33, 96, 33))
    p.ink([[90, 28], [96, 33], [90, 38]])
  },
  storage: (p) => {
    const bucket: Pt[] = [[22, 14], [30, 60], [70, 60], [78, 14]]
    p.fill([...bucket, [22, 14]])
    p.ink(ring(50, 14, 28, 6))
    p.ink(bucket)
    p.pencil(seg(26, 32, 74, 32))
  },
}

export const sceneNodeRecipe = defineRecipe<{ kind: NodeKind }>({
  id: "scene-node",
  layers: ["rest", "focus", "invalid"],
  pad: 14,
  draw(ink, b, { kind }) {
    ink.layer("rest", () => NODE_SHAPES[kind](pad(ink, b, ROLE_PAINT[NODE_ROLE[kind]])))
    ink.layer("focus", () => focusRing(ink, 0, 0, b.w, b.h, { gap: 5 }))
    ink.layer("invalid", () => {
      const s = Math.min(b.w, b.h) * 0.8
      cross(ink, (b.w - s) / 2, (b.h - s) / 2, s)
    })
  },
})

export interface EdgeParams { x1: number; y1: number; x2: number; y2: number; heads: EdgeDef<string>["heads"] }

export const sceneEdgeRecipe = defineRecipe<EdgeParams>({
  id: "scene-edge",
  layers: ["rest", "checked"],
  pad: 10,
  draw(ink, _b, p) {
    const drawEdge = (color: "pencil" | "blue") => {
      if (p.heads === "a->b") arrow(ink, p.x1, p.y1, p.x2, p.y2, { pen: color, curve: 0 })
      else if (p.heads === "b->a") arrow(ink, p.x2, p.y2, p.x1, p.y1, { pen: color, curve: 0 })
      else {
        const mx = (p.x1 + p.x2) / 2
        const my = (p.y1 + p.y2) / 2
        arrow(ink, mx, my, p.x1, p.y1, { pen: color, curve: 0 })
        arrow(ink, mx, my, p.x2, p.y2, { pen: color, curve: 0 })
      }
    }
    ink.layer("rest", () => drawEdge("pencil"))
    ink.layer("checked", () => drawEdge("blue"))
  },
})
