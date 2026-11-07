export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEMES: readonly Theme[] = ["light", "dark", "system"]
export const STORAGE_KEY = "theme"
export const DARK_QUERY = "(prefers-color-scheme: dark)"

export const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#a8c8bb",
  dark: "#0f1115",
}

export function parseTheme(value: unknown): Theme {
  return value === "light" || value === "dark" || value === "system" ? value : "system"
}

export function readTheme(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Theme {
  try {
    return parseTheme(storage?.getItem(STORAGE_KEY))
  } catch {
    return "system"
  }
}

export function writeTheme(theme: Theme, storage: Pick<Storage, "setItem"> | undefined = safeStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be full or blocked. The choice then lasts for this page only.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches
}

export function resolveTheme(theme: Theme, prefersDark: boolean = systemPrefersDark()): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light"
  return theme
}

export function applyTheme(resolved: ResolvedTheme, doc: Document = document) {
  const root = doc.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.classList.toggle("light", resolved === "light")
  doc.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[resolved])
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage
  } catch {
    return undefined
  }
}
