import { useMemo, useSyncExternalStore } from "react"

export type LessonRoute =
  | { readonly name: "lesson"; readonly slug: string; readonly section?: undefined; readonly step?: undefined }
  | { readonly name: "lesson"; readonly slug: string; readonly section: string; readonly step?: undefined }
  | { readonly name: "lesson"; readonly slug: string; readonly section?: undefined; readonly step: string }

export type Route =
  | { readonly name: "home" }
  | LessonRoute
  | { readonly name: "not-found"; readonly path: string }

function notFound(raw: string): Route {
  return { name: "not-found", path: raw }
}

export function parseRoute(hash: string): Route {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash
  const trimmed = raw.replace(/^\/+/, "").replace(/\/+$/, "")

  if (trimmed === "") {
    return { name: "home" }
  }

  const parts = trimmed.split("/")

  if (parts.some((part) => part === "")) {
    return notFound(raw)
  }

  const segments: string[] = []

  for (const part of parts) {
    try {
      segments.push(decodeURIComponent(part))
    } catch {
      return notFound(raw)
    }
  }

  const [first, slug, third, fourth] = segments

  if (first !== "learn" || slug === undefined) {
    return notFound(raw)
  }

  if (segments.length === 2) {
    return { name: "lesson", slug }
  }

  if (segments.length === 3 && third !== undefined) {
    return { name: "lesson", slug, section: third }
  }

  if (segments.length === 4 && third === "step" && fourth !== undefined) {
    return { name: "lesson", slug, step: fourth }
  }

  return notFound(raw)
}

export function href(route: Exclude<Route, { name: "not-found" }>): string {
  if (route.name === "home") {
    return "#/"
  }

  const slug = encodeURIComponent(route.slug)

  if (route.step !== undefined) {
    return `#/learn/${slug}/step/${encodeURIComponent(route.step)}`
  }

  if (route.section !== undefined) {
    return `#/learn/${slug}/${encodeURIComponent(route.section)}`
  }

  return `#/learn/${slug}`
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function getSnapshot(): string {
  return window.location.hash
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot)
  return useMemo(() => parseRoute(hash), [hash])
}
