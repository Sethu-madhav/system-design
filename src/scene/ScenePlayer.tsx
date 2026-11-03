import * as React from "react"
import { Button } from "@/components/ui/button"
import { InkLayer, useInkBox } from "@/lib/ink"
import { frameAt, type Frame, type Timeline } from "./timeline"
import { initialPlayer, reducePlayer, type PlayerEvent, type PlayerState } from "./player"
import { gridOf, layoutScene, MAX_CELL, MIN_CELL } from "./layout"
import { sceneEdgeRecipe, sceneNodeRecipe } from "./ink"
import "./scene.css"

interface SceneValue {
  timeline: Timeline
  state: PlayerState
  frame: Frame
  dispatch: React.Dispatch<PlayerEvent>
}

const SceneContext = React.createContext<SceneValue | null>(null)

function useScene(): SceneValue {
  const value = React.useContext(SceneContext)
  if (value === null) throw new Error("scene hooks must be used inside SceneProvider")
  return value
}

export function SceneProvider({ timeline, children }: { timeline: Timeline; children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer((current: PlayerState, event: PlayerEvent) => reducePlayer(timeline, current, event), initialPlayer)
  const frame = React.useMemo(() => frameAt(timeline, state.t, "reduced"), [timeline, state.t])
  const value = React.useMemo(() => ({ timeline, state, frame, dispatch }), [timeline, state, frame])
  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export function useSceneCue(stepId: string): { active: boolean } {
  return { active: useScene().frame.stepId === stepId }
}

export function ScenePlayer() {
  const { timeline, frame, dispatch } = useScene()
  const { ref, box } = useInkBox()
  const { cols, rows } = gridOf(timeline)
  const layout = box ? layoutScene(timeline, box.w - 2) : null
  return (
    <figure data-testid="scene" data-step-id={frame.stepId} className="space-y-3">
      <div ref={ref} className="w-full overflow-x-auto overflow-y-hidden" style={{ boxSizing: "content-box", paddingTop: 24, paddingBottom: 24, aspectRatio: `${cols} / ${rows}`, minHeight: rows * MIN_CELL, maxHeight: rows * MAX_CELL }}>
        {layout ? (
          <div data-testid="stage" className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
            {timeline.edges.map((edge) => {
              const g = layout.edges[edge.id]
              const view = frame.edges[edge.id]
              return <div key={edge.id} data-scene-edge={edge.id} data-visible={String(view.visible)} aria-hidden={!view.visible} data-active={view.active ? "" : undefined} className="absolute" style={{ left: g.host.x, top: g.host.y, width: g.host.w, height: g.host.h }}>
                <InkLayer recipe={sceneEdgeRecipe} seed={edge.id} params={{ x1: g.x1 - g.host.x, y1: g.y1 - g.host.y, x2: g.x2 - g.host.x, y2: g.y2 - g.host.y, heads: edge.heads }} />
              </div>
            })}
            {Object.entries(timeline.nodes).map(([id, def]) => {
              const rect = layout.nodes[id]
              const view = frame.nodes[id]
              return <div key={id} data-scene-node={id} data-kind={def.kind} data-visible={String(view.visible)} aria-hidden={!view.visible} data-focus={view.focus ? "" : undefined} data-down={view.status === "down" ? "" : undefined} className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
                <InkLayer recipe={sceneNodeRecipe} seed={id} params={{ kind: def.kind }} />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[calc(100%+1.5rem)] text-center font-hand text-sm leading-tight">{def.label}</span>
                {view.note ? <span data-testid="scene-note" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max bg-paper px-1 font-hand text-sm text-red">{view.note}</span> : null}
              </div>
            })}
          </div>
        ) : null}
      </div>
      <figcaption className="flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" aria-label="Previous step" disabled={frame.stepIndex === 0} onClick={() => dispatch({ type: "goto", step: frame.stepIndex - 1 })}>Prev</Button>
        <div aria-live="polite" className="text-center">
          <p data-testid="step-count">Step {frame.stepIndex + 1} of {timeline.steps.length}</p>
          <p data-testid="caption">{frame.caption}</p>
        </div>
        <Button variant="outline" size="sm" aria-label="Next step" disabled={frame.stepIndex === timeline.steps.length - 1} onClick={() => dispatch({ type: "goto", step: frame.stepIndex + 1 })}>Next</Button>
      </figcaption>
    </figure>
  )
}
