# Step 3: source registry and the license type

## Goal

Put the source table from `docs/sources.md` into code, so the compiler enforces the license rule:

- A lesson source that says `use: "adapted"` compiles only when its repo's rule is Adapt. Today that is only `donnemartin/system-design-primer`.
- `pnpm build` fails when `src/content/sources.ts` and the table in `docs/sources.md` disagree.
- `attribution(ref)` builds the credit line that CC BY 4.0 requires. Lessons never write that text by hand.

Nothing changes in the browser. No lesson uses these types until step 7.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it. Write `src/content/sources.test.ts` first and watch it fail.
- Run `pnpm install` first.
- Do not edit anything under `src/lib/`, `src/components/`, `src/app/`, `vendor/` or `docs/`.
- Do not add any dependency.
- Do not add code comments. The only exception is the text after each `@ts-expect-error` directive in `license.typetest.ts`, which is given below.

## Files

### `src/content/sources.ts` (new)

Export exactly these names: `Rule`, `SourceInfo`, `SOURCES`, `RepoId`, `AdaptableRepo`, `SourceRef`, `Sources`, `Attribution`, `CHANGE_NOTICE`, `attribution` and `parseSourcesTable`.

```ts
export type Rule = "adapt" | "link" | "link-only"

interface SourceBase {
  readonly title: string
  readonly author: string
  readonly url: string
  readonly license: string
}

export type SourceInfo =
  | (SourceBase & { readonly rule: "adapt"; readonly licenseUrl: string })
  | (SourceBase & { readonly rule: "link" | "link-only" })
```

`SourceBase` is not exported. A repo with rule `adapt` must have `licenseUrl`, and the type above makes a missing one a compile error.

`SOURCES` is declared `as const satisfies Record<string, SourceInfo>`, with these seven entries in this order:

| Key | rule | title | author | license | licenseUrl |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `donnemartin/system-design-primer` | `adapt` | `The System Design Primer` | `Donne Martin` | `CC BY 4.0` | `https://creativecommons.org/licenses/by/4.0/` |
| `binhnguyennus/awesome-scalability` | `link` | `awesome-scalability` | `Binh Nguyen` | `MIT` | none |
| `ByteByteGoHq/system-design-101` | `link-only` | `System Design 101` | `ByteByteGo` | `CC BY-NC-ND 4.0` | none |
| `karanpratapsingh/system-design` | `link-only` | `System Design` | `Karan Pratap Singh` | `CC BY-NC-ND 4.0` | none |
| `ashishps1/awesome-system-design-resources` | `link-only` | `awesome-system-design-resources` | `Ashish Pratap Singh` | `GPL-3.0` | none |
| `InterviewReady/system-design-resources` | `link-only` | `system-design-resources` | `InterviewReady` | `GPL-3.0` | none |
| `checkcheckzz/system-design-interview` | `link-only` | `system-design-interview` | `checkcheckzz` | `None` | none |

Every `url` is `https://github.com/` followed by the key.

The remaining types:

```ts
export type RepoId = keyof typeof SOURCES

export type AdaptableRepo = {
  [K in RepoId]: (typeof SOURCES)[K]["rule"] extends "adapt" ? K : never
}[RepoId]

export type SourceRef =
  | { readonly use: "adapted"; readonly repo: AdaptableRepo; readonly section: string; readonly anchor: string }
  | { readonly use: "link"; readonly title: string; readonly url: string; readonly repo?: RepoId }

export type Sources = readonly [SourceRef, ...SourceRef[]]

export const CHANGE_NOTICE = "Text paraphrased and shortened. Diagrams are original."

export interface Attribution {
  readonly text: string
  readonly sourceUrl: string
  readonly license: string
  readonly licenseUrl: string
  readonly changed: typeof CHANGE_NOTICE
}
```

`AdaptableRepo` is computed from `SOURCES`. Never list adaptable repos by hand.

**`attribution(ref)`** takes `Extract<SourceRef, { use: "adapted" }>` and returns an `Attribution`:

- `text` is `Adapted from "<section>" in <title> by <author>.`, with straight double quotes. For the primer's `Load balancer` section that is `Adapted from "Load balancer" in The System Design Primer by Donne Martin.`
- `sourceUrl` is the repo's `url`, then `#`, then `anchor`.
- `license` and `licenseUrl` come from the repo's `SOURCES` entry.
- `changed` is `CHANGE_NOTICE`.

Read `licenseUrl` from `SOURCES[ref.repo]` without a cast and without `!`. It type-checks because every adaptable repo has one.

**`parseSourcesTable(markdown)`** returns a `ReadonlyMap<string, Rule>` from repo key to rule. It is pure, and it reads the first markdown table whose header row starts with `| Repo |`:

1. Split the text into lines. Find the first line that starts with `| Repo |`. If there is none, throw an `Error` whose message contains `Repo table not found`.
2. Skip that line and the separator line after it.
3. Read each following line that starts with `|`. Stop at the first line that does not.
4. Split the row on `|` and trim each cell. The first cell holds a link such as `[owner/repo](https://...)`. The repo key is the text between `[` and `]`. The fourth cell is the rule.
5. Map the rule text exactly: `Adapt.` gives `adapt`, `Link.` gives `link`, and `Link only.` gives `link-only`. Any other text throws an `Error` whose message contains the unknown text.

### `src/content/license.typetest.ts` (new)

`tsc -b` compiles this file and nothing runs it. It holds two good cases and three bad ones. Each bad case is one line, with the directive on the line above. If the type ever stops rejecting a bad case, the directive becomes unused and `tsc` fails. Write it exactly like this:

```ts
import type { SourceRef } from "./sources"

export const ok: SourceRef = {
  use: "adapted",
  repo: "donnemartin/system-design-primer",
  section: "Load balancer",
  anchor: "load-balancer",
}

export const linkOnlyAsLink: SourceRef = {
  use: "link",
  repo: "ByteByteGoHq/system-design-101",
  title: "System Design 101",
  url: "https://github.com/ByteByteGoHq/system-design-101",
}

// @ts-expect-error CC BY-NC-ND repo is link only
export const bad1: SourceRef = { use: "adapted", repo: "ByteByteGoHq/system-design-101", section: "x", anchor: "x" }

// @ts-expect-error MIT repo is link, not adapt
export const bad2: SourceRef = { use: "adapted", repo: "binhnguyennus/awesome-scalability", section: "x", anchor: "x" }

// @ts-expect-error repo is not in the registry
export const bad3: SourceRef = { use: "adapted", repo: "someone/random", section: "x", anchor: "x" }
```

### `src/content/sources.test.ts` (new)

Vitest, node environment. Read `docs/sources.md` with `readFileSync` from `node:fs` and `resolve(process.cwd(), "docs/sources.md")` from `node:path`. Use these exact test names:

1. `registry matches docs/sources.md`. Parse the real file. Its map has the same keys as `SOURCES`, and each key has the same rule. Compare both directions, so an extra repo on either side fails.
2. `parseSourcesTable maps Adapt./Link./Link only.`. Use a small markdown string written in the test, with a table of three rows, one per rule, and a paragraph after the table. The result is a map of exactly those three entries.
3. `parseSourcesTable throws on an unknown rule`. A row with the rule `Copy.` throws, and the error message contains `Copy.`.
4. `parseSourcesTable throws when the table is missing`. Text with no `| Repo |` header throws.
5. `every adapt repo has licenseUrl`. For every entry in `SOURCES` with rule `adapt`, `licenseUrl` is a string that starts with `https://`.
6. `attribution names section, title, author, license, and the change notice`. For the primer ref with section `Load balancer` and anchor `load-balancer`, `text` equals `Adapted from "Load balancer" in The System Design Primer by Donne Martin.`, `license` is `CC BY 4.0`, `licenseUrl` is `https://creativecommons.org/licenses/by/4.0/`, and `changed` equals `CHANGE_NOTICE`.
7. `attribution sourceUrl is repo url + #anchor`. The same ref gives `https://github.com/donnemartin/system-design-primer#load-balancer`.

### `package.json`

Change only the `build` script, to:

```json
"build": "tsc -b && vitest run src/content && vite build"
```

The build now fails when `sources.ts` and `docs/sources.md` disagree. Keep every other script unchanged.

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm build`. Its output shows the Vitest run of `src/content/sources.test.ts` with 7 tests before the Vite build.
3. `pnpm test`, which shows 3 files and 25 tests passing.
4. `pnpm e2e`, which shows 4 tests passing.

## Prove the type test works

Do these two checks after the commands pass, and undo each change afterwards:

1. In `license.typetest.ts`, change the repo in `bad1` to `donnemartin/system-design-primer`. Run `pnpm build`. It fails with `Unused '@ts-expect-error' directive`. Undo the change.
2. In `sources.ts`, change the rule of `binhnguyennus/awesome-scalability` to `adapt` and give it a `licenseUrl`. Run `pnpm build`. It fails, both because `bad2` now compiles and because `registry matches docs/sources.md` fails. Undo the change.

## Done means

- All four commands exit 0.
- `git status` shows only `package.json` and the three new files under `src/content/`.
- `pnpm-lock.yaml` is unchanged.
- `src/content/sources.ts` has no `as` cast other than `as const`, and no `!` non-null assertion.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Show the first failing run of `sources.test.ts`, from before `sources.ts` existed. Paste the failing output of both checks in "Prove the type test works". Say whether you hit anything the spec did not cover, and what you did about it.
