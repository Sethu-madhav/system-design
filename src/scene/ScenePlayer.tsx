import * as React from "react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Slider } from "@/components/ui/slider"
import { InkLayer, useInkBox, useInkContext } from "@/lib/ink"
import { frameAt, type Frame, type Motion, type Timeline } from "./timeline"
import { initialPlayer, reducePlayer, type PlayerEvent, type PlayerState } from "./player"
import { gridOf, layoutScene, MAX_CELL, MIN_CELL, pointOn } from "./layout"
import type { PacketTone } from "./model"
import { sceneEdgeRecipe, sceneNodeRecipe } from "./ink"
import "./scene.css"

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const MAX_TICK_MS = 100

const TONE_CLASS: Readonly<Record<PacketTone, string>> = {
  request: "bg-sticky-yellow",
  response: "bg-sticky-blue",
  data: "bg-sticky-green",
  error: "bg-sticky-pink",
}

const KEYS: ReadonlyMap<string, PlayerEvent> = new Map<string, PlayerEvent>([
  [" ", { type: "toggle" }],
  ["ArrowRight", { type: "next" }],
  ["ArrowLeft", { type: "prev" }],
  ["Home", { type: "first" }],
  ["End", { type: "last" }],
])

interface SceneValue {
  timeline: Timeline
  motion: Motion
  state: PlayerState
  frame: Frame
  dispatch: React.Dispatch<PlayerEvent>
  stage: React.RefObject<HTMLElement | null>
}

interface SceneCueValue {
  stepId: string
  play: (id: string) => void
}

const SceneContext = React.createContext<SceneValue | null>(null)
const SceneCueContext = React.createContext<SceneCueValue | null>(null)

function useScene(): SceneValue {
  const value = React.useContext(SceneContext)
  if (value === null) throw new Error("scene hooks must be used inside SceneProvider")
  return value
}

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useMotion(): Motion {
  const system = React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false)
  const ink = useInkContext().motion
  return system || ink === "reduced" ? "reduced" : "full"
}

function useClock(running: boolean, dispatch: React.Dispatch<PlayerEvent>) {
  React.useEffect(() => {
    if (!running) return
    let last = performance.now()
    let id = 0
    const loop = (now: number) => {
      dispatch({ type: "tick", dt: Math.min(now - last, MAX_TICK_MS) })
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [running, dispatch])
}

export function SceneProvider({ timeline, step, children }: { timeline: Timeline; step?: string; children: React.ReactNode }) {
  const motion = useMotion()
  const [state, dispatch] = React.useReducer((current: PlayerState, event: PlayerEvent) => reducePlayer(timeline, current, event), initialPlayer)
  useClock(state.mode !== "paused", dispatch)
  const frame = React.useMemo(() => frameAt(timeline, state.t, motion), [timeline, state.t, motion])
  const stage = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (step === undefined) return
    const target = timeline.steps.find((entry) => entry.id === step)
    if (target === undefined) return
    dispatch({ type: "seek", t: target.start })
  }, [timeline, step])

  const value = React.useMemo(() => ({ timeline, motion, state, frame, dispatch, stage }), [timeline, motion, state, frame])
  const cue = React.useMemo(() => ({
    stepId: frame.stepId,
    play: (id: string) => {
      const index = timeline.steps.findIndex((entry) => entry.id === id)
      if (index < 0) return
      dispatch({ type: "goto", step: index })
      stage.current?.scrollIntoView({ block: "nearest" })
    },
  }), [timeline, frame.stepId])

  return (
    <SceneContext.Provider value={value}>
      <SceneCueContext.Provider value={cue}>{children}</SceneCueContext.Provider>
    </SceneContext.Provider>
  )
}

export function useSceneCue(stepId: string): { active: boolean; play: () => void } {
  const ctx = React.useContext(SceneCueContext)
  if (ctx === null) throw new Error("scene cue hooks must be used inside SceneProvider")
  return { active: ctx.stepId === stepId, play: () => ctx.play(stepId) }
}

export function ScenePlayer() {
  const { timeline, motion, state, frame, dispatch, stage } = useScene()
  const { ref, box } = useInkBox()
  const { cols, rows } = gridOf(timeline)
  const layout = React.useMemo(() => box ? layoutScene(timeline, box.w - 2) : null, [timeline, box?.w])
  const paused = state.mode === "paused"

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    const next = KEYS.get(event.key)
    if (next === undefined) return
    event.preventDefault()
    dispatch(next)
  }

  return (
    <figure
      ref={stage}
      data-testid="scene"
      data-step-id={frame.stepId}
      data-mode={state.mode}
      data-motion={motion}
      tabIndex={0}
      aria-label="Diagram player"
      aria-keyshortcuts="Space ArrowLeft ArrowRight Home End"
      onKeyDown={onKeyDown}
      className="space-y-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ink"
    >
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
            {frame.packets.map((packet) => {
              const edge = timeline.edges.find((entry) => entry.id === packet.edge)
              if (edge === undefined) return null
              const [x, y] = pointOn(layout.edges[packet.edge], edge.a === packet.from, packet.u)
              return (
                <div
                  key={packet.key}
                  data-scene-packet={packet.key}
                  data-tone={packet.tone}
                  aria-hidden
                  className={`pointer-events-none absolute left-0 top-0 min-w-4 whitespace-nowrap rounded-sm border border-ink px-1 text-center font-hand text-xs leading-tight shadow-sm ${TONE_CLASS[packet.tone]}`}
                  style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
                >
                  {packet.label}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
      <div aria-live="polite" className="text-center">
        <p data-testid="step-count">Step {frame.stepIndex + 1} of {timeline.steps.length}</p>
        <p data-testid="caption">{frame.caption}</p>
      </div>
      <div role="group" aria-label="Playback" className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" aria-label="First step" disabled={frame.t === 0} onClick={() => dispatch({ type: "first" })}>First</Button>
        <Button variant="outline" size="sm" aria-label="Previous step" disabled={frame.stepIndex === 0} onClick={() => dispatch({ type: "prev" })}>Prev</Button>
        <Button variant="default" size="sm" aria-label={paused ? "Play" : "Pause"} onClick={() => dispatch({ type: "toggle" })}>{paused ? "Play" : "Pause"}</Button>
        <Button variant="outline" size="sm" aria-label="Next step" disabled={frame.t === timeline.duration} onClick={() => dispatch({ type: "next" })}>Next</Button>
        <Button variant="outline" size="sm" aria-label="Last step" disabled={frame.t === timeline.duration} onClick={() => dispatch({ type: "last" })}>Last</Button>
      </div>
      <div className="relative px-0">
        <Slider data-testid="scrubber" className="will-change-transform" aria-label="Scrub through the diagram" min={0} max={timeline.duration} step={10} value={[frame.t]} getValueText={() => `Step ${frame.stepIndex + 1} of ${timeline.steps.length}`} onValueChange={(values) => dispatch({ type: "seek", t: values[0] ?? 0 })} />
        {timeline.steps.slice(1).map((step) => (
          <span key={step.id} data-step-tick={step.id} aria-hidden className="pointer-events-none absolute top-full mt-0.5 h-2 w-px -translate-x-1/2 bg-pencil" style={{ left: `calc(10px + (100% - 20px) * ${step.start / timeline.duration})` }} />
        ))}
      </div>
      <p className="hidden text-center text-sm text-pencil-text md:block"><Kbd>Space</Kbd> play or pause, <Kbd>←</Kbd> <Kbd>→</Kbd> step</p>
    </figure>
  )
}
