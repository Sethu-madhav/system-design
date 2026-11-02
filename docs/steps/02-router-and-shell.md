# Step 2: hash router and app shell

## Goal

Replace the playground page with the app's own shell. The URL hash picks the page:

- `#/` or no hash shows the home page, a paper sheet with the heading "Learn system design".
- Any other hash shows a not-found page with a link back home.

Every later page plugs into this router. The route is a typed value, never a raw string, and links are built only with `href`.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it. Write `src/app/routes.test.ts` first and watch it fail.
- Run `pnpm install` first.
- Do not edit anything under `src/lib/`, `src/components/`, `vendor/` or `docs/`.
- Do not add a router library or any other dependency.
- Do not add code comments.
- Browser tests import `test`, `expect` and `gotoReady` from `./fixtures`, never from `@playwright/test`. The fixture already fails any test that logs a console error.
- Select elements in browser tests by role, text or `data-testid`, never by CSS class.

## Files

### `src/app/routes.ts` (new)

Export exactly these:

```ts
export type LessonRoute =
  | { readonly name: "lesson"; readonly slug: string; readonly section?: undefined; readonly step?: undefined }
  | { readonly name: "lesson"; readonly slug: string; readonly section: string; readonly step?: undefined }
  | { readonly name: "lesson"; readonly slug: string; readonly section?: undefined; readonly step: string }

export type Route =
  | { readonly name: "home" }
  | LessonRoute
  | { readonly name: "not-found"; readonly path: string }

export function parseRoute(hash: string): Route
export function href(route: Exclude<Route, { name: "not-found" }>): string
export function useRoute(): Route
```

A lesson route can have a section or a step, but not both. The type above makes both at once a compile error.

**`parseRoute(hash)`** is pure and never throws. Apply these rules in order:

1. Remove one leading `#` if present. Call the result `raw`.
2. Remove all leading `/` characters and all trailing `/` characters.
3. If the result is empty, return `{ name: "home" }`.
4. Split on `/`. If any segment is empty (as in `learn//x`), return not-found.
5. Decode each segment with `decodeURIComponent`. If decoding throws, return not-found.
6. Match the decoded segments:
   - `["learn", slug]` returns `{ name: "lesson", slug }`.
   - `["learn", slug, "step", step]` returns `{ name: "lesson", slug, step }`.
   - `["learn", slug, section]` returns `{ name: "lesson", slug, section }`. This includes a section named `step`, as in `#/learn/x/step`.
   - Anything else returns not-found.
7. A not-found route is `{ name: "not-found", path: raw }`. `path` is the hash with only the `#` removed, before any other change.

Return objects with only the keys listed. A home route has no `slug`, and a lesson route without a section has no `section` key at all. Tests use `toEqual` and `toStrictEqual`.

**`href(route)`** builds the hash for a route:

- home gives `#/`.
- A lesson gives `#/learn/<slug>`.
- A lesson with a section gives `#/learn/<slug>/<section>`.
- A lesson with a step gives `#/learn/<slug>/step/<step>`.

Encode every slug, section and step with `encodeURIComponent`. The output never contains anything before `#`, so links work under any base path.

**`useRoute()`** reads `window.location.hash` with `useSyncExternalStore`, subscribing to the `hashchange` event. It returns `parseRoute(hash)`, memoized on the hash string with `useMemo`. It does no scrolling. Scrolling to sections comes in step 8.

### `src/app/routes.test.ts` (new)

Vitest, node environment. Use these exact test names:

1. `empty hash is home`. Both `parseRoute("")` and `parseRoute("#")` give `{ name: "home" }`.
2. `#/ is home`.
3. `#/learn/load-balancer is lesson`. It gives `{ name: "lesson", slug: "load-balancer" }`, checked with `toStrictEqual`.
4. `trailing slash is ignored`. `#/learn/load-balancer/` equals the route without the slash.
5. `missing leading slash is tolerated`. `#learn/load-balancer` gives the same lesson route.
6. `#/learn/load-balancer/what-it-does sets section`.
7. `#/learn/load-balancer/step/pick sets step`.
8. `a section may be named step`. `#/learn/x/step` gives `{ name: "lesson", slug: "x", section: "step" }`.
9. `percent-encoded slug decodes`. `#/learn/caf%C3%A9` gives slug `café`.
10. `malformed percent-encoding is not-found`. `#/learn/%E0%A4%A` gives not-found with path `/learn/%E0%A4%A`.
11. `unknown path is not-found with path`. `#/nowhere/x` gives `{ name: "not-found", path: "/nowhere/x" }`.
12. `#/learn/ with no slug is not-found`.
13. `empty segment is not-found`. `#/learn//x` gives not-found.
14. `extra segments are not-found`. Both `#/learn/x/a/b` and `#/learn/x/step/a/b` give not-found.
15. `href round-trips every route shape`. For home, a lesson, a lesson with a section and a lesson with a step, `parseRoute(href(r))` `toStrictEqual` `r`. Include one slug with a space and one section with a `/` in it, so that encoding is tested.
16. `href output starts with #/`. Every route shape in test 15 gives a string that starts with `#/`.
17. `parseRoute never throws on 200 random strings`. Build the strings with a small seeded generator written in the test, over the characters `#/%a-z0-9 .?&=` and lengths 0 to 30. Do not use `Math.random`, so a failure can be reproduced. Every result's `name` is one of `home`, `lesson` or `not-found`.

### `src/app/App.tsx` (new)

A named export `App`. It wraps everything in `InkProvider` from `@/lib/ink/react` and renders `Shell`. Inside the shell it switches on `useRoute()`:

- `home` renders `HomePage`.
- `lesson` renders `NotFoundPage` with the route's path, since no lessons exist yet. Build the path as `href(route).slice(1)`. Step 8 replaces this branch.
- `not-found` renders `NotFoundPage` with `route.path`.

Write the switch so TypeScript checks that every `route.name` is handled. Use a `switch` with a `never` check in the default case.

### `src/app/Shell.tsx` (new)

`Shell({ children })` renders this layout:

- A `<header>` with a link to `href({ name: "home" })` whose text is `System design`.
- An empty `<aside data-testid="sidebar" aria-label="Lessons">`. Step 8 fills it.
- A `<main data-testid="page">` holding `children` inside a Looseleaf `Paper` from `@/components/ui/paper`, with `stock="paper"` and `as="article"`.

Desktop width puts the sidebar left of the main area. Below 768px the sidebar is hidden and main takes the full width. Use Tailwind classes. Keep the existing `bg-desk` body background from `index.html`.

### `src/app/HomePage.tsx` (new)

Renders an `<h1>` with the text `Learn system design` and one paragraph: `Read a lesson, watch the system move, then check yourself with a short quiz.`

### `src/app/NotFoundPage.tsx` (new)

`NotFoundPage({ path })` renders:

- An `<h1>` with the text `Page not found`.
- A paragraph that shows the path inside a `<code>` element.
- A link to `href({ name: "home" })` with the text `Back to home`.

### `src/main.tsx`

Import `{ App }` from `@/app/App` instead of the default import from `./App`. Keep `React.StrictMode` and the `./index.css` import.

### `src/App.tsx`

Delete it. It is the old playground.

### `e2e/routing.spec.ts` (new)

Three tests with these exact names:

1. `home renders heading`. `gotoReady(page, "/")`. The heading `Learn system design` (role `heading`, level 1) is visible.
2. `unknown hash shows not found and a link home that works`. `gotoReady(page, "/#/nowhere")`. The `Page not found` heading is visible and the page shows the text `/nowhere`. Click `Back to home`. The home heading is visible and the URL ends with `#/`.
3. `browser back returns to the previous route`. Open `/#/nowhere`, click `Back to home`, then call `page.goBack()`. The `Page not found` heading is visible again.

Keep `e2e/smoke.spec.ts` unchanged. It must still pass.

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm build`
3. `pnpm test`, which shows 2 files passing, `src/smoke.test.ts` and `src/app/routes.test.ts`, with 18 tests in total.
4. `pnpm e2e`, which shows 4 tests passing.

## Done means

- All four commands exit 0.
- `git status` shows only the files listed above.
- No dependency was added. `package.json` and `pnpm-lock.yaml` are unchanged.
- `pnpm dev` shows the paper home page. `#/anything` shows the not-found page.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Show the first failing run of `routes.test.ts`, from before `routes.ts` existed. Say whether you hit anything the spec did not cover, and what you did about it.
