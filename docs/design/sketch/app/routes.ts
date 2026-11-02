// src/app/routes.ts
//
// Owns: URLs. Hash routing (#/learn/load-balancer) so the static build works on
// GitHub Pages with no 404.html fallback and no server rewrite, and the same
// build works under any base path. A route is a discriminated union; pages get a
// typed route, never a string. `href` is the only way links are built.
//
//   #/                                  home
//   #/learn/<slug>                      lesson
//   #/learn/<slug>/<section>            lesson scrolled to an h2/h3 id
//   #/learn/<slug>/step/<step-id>       lesson with the scene parked at a step (search hits on captions)
//   anything else                       not-found

export type Route =
  | { readonly name: "home" }
  | { readonly name: "lesson"; readonly slug: string; readonly section?: string; readonly step?: string }
  | { readonly name: "not-found"; readonly path: string }

/** Total: never throws; unknown input -> not-found. Tolerates a missing leading "#" or "/", trailing slash, %-encoding. */
export function parseRoute(_hash: string): Route {
  throw new Error("not implemented")
}

/** Inverse of parseRoute for every route it can produce: parseRoute(href(r)) deep-equals r. */
export function href(_r: Exclude<Route, { name: "not-found" }>): string {
  throw new Error("not implemented")
}

/** useSyncExternalStore over "hashchange". Scrolls to top on lesson change, to `section` when set. */
export function useRoute(): Route {
  throw new Error("not implemented")
}
