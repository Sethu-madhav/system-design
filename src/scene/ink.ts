import { asterisk, arrow, box, cloud, cross, dashedBox, defineRecipe, focusRing, line, loop, squiggle, type Box, type Ink } from "@/lib/ink"
import type { NodeKind } from "./model"
import type { EdgeDef } from "./timeline"

export const NODE_SHAPES: Readonly<Record<NodeKind, (ink: Ink, b: Box) => void>> = {
  client: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h * 0.75 - 3); line(ink, b.w * 0.25, b.h * 0.82, b.w * 0.75, b.h * 0.82) },
  internet: (ink, b) => cloud(ink, b.w / 2, b.h / 2, b.w - 6, b.h - 6),
  dns: (ink, b) => { box(ink, 3, 7, b.w - 6, b.h - 10); box(ink, 7, 3, b.w * 0.35, 8) },
  cdn: (ink, b) => { cloud(ink, b.w / 2, b.h / 2, b.w - 6, b.h - 6); cloud(ink, b.w / 2, b.h / 2, b.w * 0.48, b.h * 0.42, { pen: "pencil" }) },
  lb: (ink, b) => { loop(ink, b.w / 2, b.h / 2, (b.w - 6) / 2, (b.h - 6) / 2); line(ink, b.w * 0.27, b.h / 2, b.w * 0.73, b.h / 2, { pen: "pencil" }) },
  proxy: (ink, b) => dashedBox(ink, 3, 3, b.w - 6, b.h - 6, { r: b.h / 3 }),
  server: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); line(ink, 7, b.h / 3, b.w - 7, b.h / 3, { pen: "pencil" }); line(ink, 7, b.h * 2 / 3, b.w - 7, b.h * 2 / 3, { pen: "pencil" }) },
  service: (ink, b) => box(ink, 3, 3, b.w - 6, b.h - 6, { corner: b.h / 4 }),
  cache: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); squiggle(ink, 8, b.h / 2, b.w - 16, { pen: "orange" }) },
  db: (ink, b) => { loop(ink, b.w / 2, 8, (b.w - 6) / 2, 6); loop(ink, b.w / 2, b.h - 8, (b.w - 6) / 2, 6, { turns: 0.5, a0: 0 }); line(ink, 3, 8, 3, b.h - 8); line(ink, b.w - 3, 8, b.w - 3, b.h - 8) },
  queue: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); for (const x of [b.w / 4, b.w / 2, b.w * 3 / 4]) line(ink, x, 6, x, b.h - 6, { pen: "pencil" }) },
  worker: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); asterisk(ink, b.w / 2, b.h / 2, b.h * 0.35, { pen: "pencil" }) },
  storage: (ink, b) => { loop(ink, b.w / 2, 8, (b.w - 6) / 2, 5); line(ink, 3, 8, 8, b.h - 4); line(ink, b.w - 3, 8, b.w - 8, b.h - 4); line(ink, 8, b.h - 4, b.w - 8, b.h - 4) },
}

export const sceneNodeRecipe = defineRecipe<{ kind: NodeKind }>({
  id: "scene-node",
  layers: ["rest", "focus", "invalid"],
  pad: 14,
  draw(ink, b, { kind }) {
    ink.layer("rest", () => NODE_SHAPES[kind](ink, b))
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
