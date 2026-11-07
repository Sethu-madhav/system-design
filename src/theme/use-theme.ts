import { useCallback, useEffect, useSyncExternalStore } from "react"
import { DARK_QUERY, STORAGE_KEY, applyTheme, readTheme, resolveTheme, writeTheme, type ResolvedTheme, type Theme } from "./theme"

const listeners = new Set<() => void>()
let current: Theme = readTheme()

function emit() {
  for (const listener of listeners) listener()
}

function setCurrent(theme: Theme) {
  if (theme === current) return
  current = theme
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) setCurrent(readTheme())
  }
  media.addEventListener("change", listener)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener("change", listener)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot(): string {
  return `${current}:${resolveTheme(current)}`
}

export function useTheme(): { theme: Theme; resolved: ResolvedTheme; setTheme: (theme: Theme) => void } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [theme, resolved] = snapshot.split(":") as [Theme, ResolvedTheme]

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next)
    setCurrent(next)
  }, [])

  return { theme, resolved, setTheme }
}
