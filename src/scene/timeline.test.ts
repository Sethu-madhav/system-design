import { expect, test } from "vitest"
import { fixture } from "./fixtures"
import { defineScene } from "./model"
import {
  MAX_STEP_MS,
  READ_MS_PER_WORD,
  SceneError,
  SEND_MS,
  compile,
  frameAt,
  readingTime,
  stepIndexAt,
} from "./timeline"

test("defineScene keeps step order from object keys", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    zeta: s.step("zeta"),
    alpha: s.step("alpha"),
    mid: s.step("mid"),
  }))

  expect(scene.steps.map((step) => step.id)).toEqual(["zeta", "alpha", "mid"])
})

test("edges derived one per unordered pair", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
      b: { kind: "server", label: "B", at: [1, 0] },
      c: { kind: "server", label: "C", at: [2, 0] },
    }).steps((s) => ({
      go: s.step("go", s.send("a", "b"), s.send("b", "a"), s.send("a", "c")),
    })),
  )

  expect(timeline.edges.map((edge) => edge.id)).toEqual(["a~b", "a~c"])
})

test("heads both when sends go both ways", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
      b: { kind: "server", label: "B", at: [1, 0] },
      c: { kind: "server", label: "C", at: [2, 0] },
    }).steps((s) => ({
      go: s.step("go", s.send("a", "b"), s.send("b", "a"), s.send("a", "c")),
    })),
  )

  expect(timeline.edges[0].heads).toBe("both")
  expect(timeline.edges[1].heads).toBe("a->b")

  const reverse = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
      z: { kind: "server", label: "Z", at: [1, 0] },
    }).steps((s) => ({
      go: s.step("go", s.send("z", "a")),
    })),
  )

  expect(reverse.edges[0].id).toBe("a~z")
  expect(reverse.edges[0].heads).toBe("b->a")
})

test("hidden node is invisible until show", () => {
  expect(fixture.steps[0].world.server.visible).toBe(false)
  expect(fixture.steps[1].world.server.visible).toBe(true)
  expect(fixture.steps[0].entering).toEqual([])
  expect(fixture.steps[1].entering).toEqual(["server"])
})

test("show of a visible node throws", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x", s.show("a")),
  }))

  expect(() => compile(scene)).toThrow(SceneError)
  expect(() => compile(scene)).toThrow("show of visible node a in step first")
})

test("hide of a hidden node and down of a down node throw", () => {
  const hidden = defineScene({
    a: { kind: "server", label: "A", at: [0, 0], hidden: true },
  }).steps((s) => ({
    first: s.step("x", s.hide("a")),
  }))

  expect(() => compile(hidden)).toThrow(SceneError)
  expect(() => compile(hidden)).toThrow("hide of hidden node a in step first")

  const down = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x", s.down("a")),
    second: s.step("y", s.down("a")),
  }))

  expect(() => compile(down)).toThrow(SceneError)
  expect(() => compile(down)).toThrow("down of a in step second")

  const downHidden = defineScene({
    a: { kind: "server", label: "A", at: [0, 0], hidden: true },
  }).steps((s) => ({
    first: s.step("x", s.down("a")),
  }))

  expect(() => compile(downHidden)).toThrow("down of a in step first")

  const upUp = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x", s.up("a")),
  }))

  expect(() => compile(upUp)).toThrow("up of a in step first")

  const upHidden = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x", s.down("a")),
    second: s.step("y", s.hide("a")),
    third: s.step("z", s.up("a")),
  }))

  expect(() => compile(upHidden)).toThrow("up of a in step third")
})

test("send from a hidden node throws", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
    b: { kind: "server", label: "B", at: [1, 0], hidden: true },
  }).steps((s) => ({
    first: s.step("x", s.send("b", "a")),
  }))

  expect(() => compile(scene)).toThrow(SceneError)
  expect(() => compile(scene)).toThrow("b is not visible in step first")
})

test("focus or note on a hidden node throws", () => {
  const focused = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
    b: { kind: "server", label: "B", at: [1, 0], hidden: true },
  }).steps((s) => ({
    first: s.step("x", s.focus("b")),
  }))

  expect(() => compile(focused)).toThrow(SceneError)
  expect(() => compile(focused)).toThrow("b is not visible in step first")

  const noted = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
    b: { kind: "server", label: "B", at: [1, 0], hidden: true },
  }).steps((s) => ({
    first: s.step("x", s.note("b", "hi")),
  }))

  expect(() => compile(noted)).toThrow(SceneError)
  expect(() => compile(noted)).toThrow("b is not visible in step first")
})

test("send to self throws", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x", s.send("a", "a")),
  }))

  expect(() => compile(scene)).toThrow(SceneError)
  expect(() => compile(scene)).toThrow("send from a to itself in step first")
})

test("two notes on one node in a step throws", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x", s.note("a", "one"), s.note("a", "two")),
  }))

  expect(() => compile(scene)).toThrow(SceneError)
  expect(() => compile(scene)).toThrow("two notes on a in step first")
})

test("two nodes in one cell throws", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [1, 2] },
    b: { kind: "server", label: "B", at: [1, 2] },
  }).steps((s) => ({
    first: s.step("x"),
  }))

  expect(() => compile(scene)).toThrow(SceneError)
  expect(() => compile(scene)).toThrow("a and b share a cell")

  const hidden = defineScene({
    a: { kind: "server", label: "A", at: [1, 2] },
    b: { kind: "server", label: "B", at: [1, 2], hidden: true },
  }).steps((s) => ({
    first: s.step("x"),
  }))

  expect(() => compile(hidden)).toThrow("a and b share a cell")
})

test("integer-like step id throws", () => {
  const scene = defineScene({
    a: { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    "1": s.step("x"),
  }))

  expect(() => compile(scene)).toThrow(SceneError)
  expect(() => compile(scene)).toThrow("bad step id 1")
})

test("bad node id throws", () => {
  const squiggle = defineScene({
    "a~b": { kind: "server", label: "A", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x"),
  }))

  expect(() => compile(squiggle)).toThrow(SceneError)
  expect(() => compile(squiggle)).toThrow("bad node id a~b")

  const upper = defineScene({
    Lb: { kind: "server", label: "L", at: [0, 0] },
  }).steps((s) => ({
    first: s.step("x"),
  }))

  expect(() => compile(upper)).toThrow(SceneError)
  expect(() => compile(upper)).toThrow("bad node id Lb")
})

test("step start/end are contiguous and duration is the sum", () => {
  expect(fixture.steps[0].start).toBe(0)

  for (let index = 1; index < fixture.steps.length; index += 1) {
    expect(fixture.steps[index].start).toBe(fixture.steps[index - 1].end)
  }

  expect(fixture.duration).toBe(fixture.steps[fixture.steps.length - 1].end)
  expect(fixture.duration).toBe(
    fixture.steps.reduce((total, step) => total + (step.end - step.start), 0),
  )
})

test("step length is at least reading time", () => {
  const caption = Array.from({ length: 20 }, (_, index) => `word${index}`).join(" ")
  const timeline = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
      b: { kind: "server", label: "B", at: [1, 0] },
    }).steps((s) => ({
      go: s.step(caption, s.send("a", "b")),
    })),
  )

  expect(readingTime(caption)).toBe(20 * READ_MS_PER_WORD)
  expect(readingTime("")).toBe(1600)
  expect(readingTime(Array.from({ length: 40 }, () => "word").join(" "))).toBe(MAX_STEP_MS)
  expect(timeline.steps[0].end - timeline.steps[0].start).toBe(20 * READ_MS_PER_WORD)
})

test("sequential sends are SEND_MS apart", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
      b: { kind: "server", label: "B", at: [1, 0] },
    }).steps((s) => ({
      go: s.step("go", s.send("a", "b"), s.send("b", "a")),
    })),
  )

  const [first, second] = timeline.steps[0].flights

  expect(second.t0 - first.t0).toBe(SEND_MS)
  expect(first.t1).toBe(second.t0)
  expect(first.t1 - first.t0).toBe(SEND_MS)
})

test("parallel sends share t0", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
      b: { kind: "server", label: "B", at: [1, 0] },
      c: { kind: "server", label: "C", at: [2, 0] },
    }).steps((s) => ({
      go: s.step("go", s.parallel(s.send("a", "b"), s.send("a", "c")), s.send("a", "b")),
    })),
  )

  const [first, second, third] = timeline.steps[0].flights

  expect(second.t0).toBe(first.t0)
  expect(second.t1).toBe(first.t1)
  expect(third.t0).toBe(first.t1)
})

test("stepIndexAt at exact boundary belongs to next step", () => {
  expect(stepIndexAt(fixture, 1600)).toBe(1)
  expect(stepIndexAt(fixture, 3440)).toBe(2)
  expect(stepIndexAt(fixture, 5640)).toBe(3)
})

test("stepIndexAt at duration is the last step", () => {
  expect(stepIndexAt(fixture, 7240)).toBe(3)
  expect(stepIndexAt(fixture, 99999)).toBe(3)
})

test("frameAt mid-flight gives u≈0.5", () => {
  const frame = frameAt(fixture, 600, "full")

  expect(frame.packets).toHaveLength(1)
  expect(frame.packets[0].u).toBeCloseTo(0.5)
  expect(frame.edges["client~lb"].active).toBe(true)
})

test("frameAt before LEAD_MS has no packets", () => {
  const frame = frameAt(fixture, 100, "full")

  expect(frame.packets).toEqual([])
  expect(Object.values(frame.edges).some((edge) => edge.active)).toBe(false)
})

test("frameAt reduced has no packets and marks the step's edges active", () => {
  const frame = frameAt(fixture, 100, "reduced")

  expect(frame.packets).toEqual([])
  expect(frame.edges["client~lb"].active).toBe(true)
})

test("fixture timeline has the documented times", () => {
  expect(fixture.steps.map((step) => [step.id, step.start, step.end])).toEqual([
    ["ask", 0, 1600],
    ["route", 1600, 3440],
    ["answer", 3440, 5640],
    ["fail", 5640, 7240],
  ])
  expect(fixture.steps[0].flights.map((flight) => [flight.t0, flight.t1])).toEqual([[200, 1000]])
  expect(fixture.steps[1].flights.map((flight) => [flight.t0, flight.t1])).toEqual([[1800, 2600]])
  expect(fixture.steps[2].flights.map((flight) => [flight.t0, flight.t1])).toEqual([
    [3640, 4440],
    [4440, 5240],
  ])
  expect(fixture.steps[3].flights).toEqual([])
  expect(fixture.duration).toBe(7240)
  expect(fixture.edges.map((edge) => [edge.id, edge.heads])).toEqual([
    ["client~lb", "both"],
    ["lb~server", "both"],
  ])
})

test("frameAt reduced is identical for any t inside a step", () => {
  const start = fixture.steps[2].start
  const first = frameAt(fixture, start, "reduced")

  for (let index = 0; index < 20; index += 1) {
    const frame = frameAt(fixture, start + index * 110, "reduced")

    expect({ ...frame, t: 0 }).toEqual({ ...first, t: 0 })
  }
})

test("focus and note only during their step", () => {
  const frames = fixture.steps.map((step) => frameAt(fixture, step.start, "reduced"))

  expect(frames.map((frame) => frame.nodes.lb.focus)).toEqual([false, true, false, false])
  expect(frames.map((frame) => "note" in frame.nodes.lb)).toEqual([false, false, false, true])
  expect(frames[3].nodes.lb.note).toBe("health check failed")
})

test("down persists into later steps", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "server", label: "A", at: [0, 0] },
    }).steps((s) => ({
      first: s.step("one", s.down("a")),
      second: s.step("two"),
      third: s.step("three"),
    })),
  )

  expect(timeline.steps[0].world.a.status).toBe("down")
  expect(frameAt(timeline, timeline.steps[1].start, "full").nodes.a.status).toBe("down")
  expect(frameAt(timeline, timeline.steps[2].start, "full").nodes.a.status).toBe("down")
})

test("frameAt clamps t < 0 and t > duration", () => {
  expect(frameAt(fixture, -5, "full").t).toBe(0)
  expect(frameAt(fixture, 1e9, "full").t).toBe(7240)
  expect(frameAt(fixture, NaN, "full").t).toBe(0)
})
