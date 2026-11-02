import { describe, expect, test } from "vitest"
import { href, parseRoute, type Route } from "@/app/routes"

const shapes: ReadonlyArray<Exclude<Route, { name: "not-found" }>> = [
  { name: "home" },
  { name: "lesson", slug: "load-balancer" },
  { name: "lesson", slug: "café au lait", section: "what/why" },
  { name: "lesson", slug: "load-balancer", step: "pick" },
]

function randomStrings(count: number): string[] {
  const chars = "#/%abcdefghijklmnopqrstuvwxyz0123456789 .?&="
  let seed = 42
  const next = () => {
    seed = (seed * 16807) % 2147483647
    return seed
  }
  const values: string[] = []
  for (let i = 0; i < count; i += 1) {
    const length = next() % 31
    let value = ""
    for (let j = 0; j < length; j += 1) {
      value += chars[next() % chars.length]
    }
    values.push(value)
  }
  return values
}

describe("parseRoute", () => {
  test("empty hash is home", () => {
    expect(parseRoute("")).toEqual({ name: "home" })
    expect(parseRoute("#")).toEqual({ name: "home" })
  })

  test("#/ is home", () => {
    expect(parseRoute("#/")).toEqual({ name: "home" })
  })

  test("#/learn/load-balancer is lesson", () => {
    expect(parseRoute("#/learn/load-balancer")).toStrictEqual({ name: "lesson", slug: "load-balancer" })
  })

  test("trailing slash is ignored", () => {
    expect(parseRoute("#/learn/load-balancer/")).toEqual(parseRoute("#/learn/load-balancer"))
  })

  test("missing leading slash is tolerated", () => {
    expect(parseRoute("#learn/load-balancer")).toStrictEqual({ name: "lesson", slug: "load-balancer" })
  })

  test("#/learn/load-balancer/what-it-does sets section", () => {
    expect(parseRoute("#/learn/load-balancer/what-it-does")).toStrictEqual({
      name: "lesson",
      slug: "load-balancer",
      section: "what-it-does",
    })
  })

  test("#/learn/load-balancer/step/pick sets step", () => {
    expect(parseRoute("#/learn/load-balancer/step/pick")).toStrictEqual({
      name: "lesson",
      slug: "load-balancer",
      step: "pick",
    })
  })

  test("a section may be named step", () => {
    expect(parseRoute("#/learn/x/step")).toStrictEqual({ name: "lesson", slug: "x", section: "step" })
  })

  test("percent-encoded slug decodes", () => {
    expect(parseRoute("#/learn/caf%C3%A9")).toStrictEqual({ name: "lesson", slug: "café" })
  })

  test("malformed percent-encoding is not-found", () => {
    expect(parseRoute("#/learn/%E0%A4%A")).toStrictEqual({ name: "not-found", path: "/learn/%E0%A4%A" })
  })

  test("unknown path is not-found with path", () => {
    expect(parseRoute("#/nowhere/x")).toStrictEqual({ name: "not-found", path: "/nowhere/x" })
  })

  test("#/learn/ with no slug is not-found", () => {
    expect(parseRoute("#/learn/")).toStrictEqual({ name: "not-found", path: "/learn/" })
  })

  test("empty segment is not-found", () => {
    expect(parseRoute("#/learn//x")).toStrictEqual({ name: "not-found", path: "/learn//x" })
  })

  test("extra segments are not-found", () => {
    expect(parseRoute("#/learn/x/a/b").name).toBe("not-found")
    expect(parseRoute("#/learn/x/step/a/b").name).toBe("not-found")
  })

  test("parseRoute never throws on 200 random strings", () => {
    const names = ["home", "lesson", "not-found"]
    const values = randomStrings(200)
    expect(values.join("")).toContain("/")
    expect(values.join("")).toContain("%")
    for (const value of values) {
      expect(names).toContain(parseRoute(value).name)
    }
  })
})

describe("href", () => {
  test("href round-trips every route shape", () => {
    for (const route of shapes) {
      expect(parseRoute(href(route))).toStrictEqual(route)
    }
  })

  test("href output starts with #/", () => {
    for (const route of shapes) {
      expect(href(route).startsWith("#/")).toBe(true)
    }
  })
})
