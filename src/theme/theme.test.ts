import { describe, expect, test } from "vitest"
import { parseTheme, readTheme, resolveTheme, writeTheme } from "./theme"

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  }
}

describe("theme", () => {
  test("parseTheme keeps valid values and falls back to system", () => {
    expect(parseTheme("light")).toBe("light")
    expect(parseTheme("dark")).toBe("dark")
    expect(parseTheme("system")).toBe("system")
    expect(parseTheme("blue")).toBe("system")
    expect(parseTheme(null)).toBe("system")
  })

  test("readTheme reads storage and survives a throwing storage", () => {
    expect(readTheme(memoryStorage({ theme: "dark" }))).toBe("dark")
    expect(readTheme(memoryStorage({ theme: "DARK" }))).toBe("system")
    expect(readTheme(memoryStorage())).toBe("system")
    expect(readTheme({ getItem: () => { throw new Error("blocked") } })).toBe("system")
  })

  test("writeTheme stores the choice and ignores storage errors", () => {
    const storage = memoryStorage()
    writeTheme("light", storage)
    expect(storage.data.get("theme")).toBe("light")
    expect(() => writeTheme("dark", { setItem: () => { throw new Error("full") } })).not.toThrow()
  })

  test("resolveTheme follows the system only in system mode", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
  })
})
