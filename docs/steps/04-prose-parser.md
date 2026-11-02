# Step 4: prose parser

## Goal

Lesson text is markdown written inside an `md` tagged template. The only values a lesson may put inside `${...}` are cue tokens, which tie a phrase in the text to a step of the diagram. `md` parses the text once, when the lesson module loads, into a small typed tree called `Prose`. Later steps render that tree and search it. Neither ever sees markdown.

`md` accepts a small subset of markdown and throws on anything else. Images, raw HTML and tables throw, so a lesson cannot embed a copied source image.

Nothing changes in the browser. No lesson uses `md` until step 7.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it. Write `src/content/prose.test.ts` first and watch it fail.
- Run `pnpm install` first.
- Do not edit anything outside the two new files and `src/content/prose.typetest.ts`. Do not edit `package.json`.
- Do not add any dependency. Do not use a markdown library. Write the parser by hand.
- Do not add code comments. The only exception is the text after the `@ts-expect-error` directive given below.

## Files

### `src/content/prose.ts` (new)

Export exactly these names: `Inline`, `CalloutKind`, `Block`, `Prose`, `CueToken`, `CueFn`, `makeCue`, `md`, `blockText` and `slugify`.

```ts
export type Inline =
  | { readonly t: "text"; readonly v: string }
  | { readonly t: "strong"; readonly c: readonly Inline[] }
  | { readonly t: "em"; readonly c: readonly Inline[] }
  | { readonly t: "code"; readonly v: string }
  | { readonly t: "link"; readonly href: string; readonly c: readonly Inline[] }
  | { readonly t: "cue"; readonly step: string; readonly text: string }

export type CalloutKind = "note" | "tradeoff" | "pitfall"

export type Block =
  | { readonly t: "h"; readonly level: 2 | 3; readonly id: string; readonly c: readonly Inline[] }
  | { readonly t: "p"; readonly c: readonly Inline[] }
  | { readonly t: "ul" | "ol"; readonly items: readonly (readonly Inline[])[] }
  | { readonly t: "callout"; readonly kind: CalloutKind; readonly c: readonly Inline[] }
  | { readonly t: "code"; readonly lang: string; readonly v: string }

export interface Prose {
  readonly blocks: readonly Block[]
  readonly cues: readonly string[]
  readonly words: number
}

declare const cueBrand: unique symbol
export interface CueToken<S extends string = string> {
  readonly [cueBrand]: S
}

export type CueFn<S extends string> = (step: S, text: string) => CueToken<S>

export function makeCue<S extends string>(): CueFn<S>
export function md(strings: TemplateStringsArray, ...cues: CueToken[]): Prose
export function blockText(block: Block): string
export function slugify(text: string): string
```

Every error the module throws is an `Error` whose message starts with `prose: `.

#### Cue tokens

`makeCue<S>()` returns a function. Each call `cue(step, text)` creates a new frozen empty object, records `{ step, text }` for it in a module-level `WeakMap`, and returns it as a `CueToken<S>`. That return is the only cast allowed in the file. Only `md` reads the `WeakMap`.

Because `md`'s rest parameter is typed `CueToken[]`, `` md`${"plain"}` `` does not compile. At runtime `md` also checks every interpolated value. A value that is not in the `WeakMap` throws `prose: interpolation is not a cue`.

#### How `md` parses

`md` reads `strings.raw`, not the cooked strings, so a backslash in a code sample such as `"a\nb"` or `/\d+/` stays a backslash. It then turns `` \` `` into a backtick, `\$` into `$` and `\\` into one backslash. Changed after review. The first version of this spec used the cooked strings, which turned `\n` in code into a newline.

1. **Join.** If any string contains the character U+E000, throw. Join the strings with U+E000 in place of each interpolation. Each U+E000 is one cue. Cues are used up in order, so the first U+E000 is `cues[0]`.
2. **Dedent.** Split the text on `\n`. Drop the blank lines at the start and the end. A blank line is empty or only whitespace. Find the smallest number of leading spaces over the non-blank lines. Remove that many characters from the start of each non-blank line. Every blank line becomes `""`.
3. **Fenced code.** A line that starts with three backticks opens a code block. `lang` is the rest of that line, trimmed, and may be `""`. The block runs to the next line that is exactly three backticks. Its `v` is the lines in between joined with `\n`, kept exactly as they are after dedent, blank lines included. Nothing inside is parsed. A fence that never closes throws. A U+E000 inside a code block throws `prose: cue inside code`.
4. **Groups.** Outside code, a run of consecutive non-blank lines is one group. A blank line ends a group. A fence line also ends a group. A heading line is always a group on its own, even with no blank line around it.
5. **Unsupported syntax.** Check every line outside code blocks. Use the line with leading spaces trimmed. For the image and HTML checks, ignore the text inside inline code spans. Throw `` prose: unsupported syntax "<trimmed line>" `` when the line does any of these:
   - starts with `|`, which is a table;
   - starts with `#` but not with `## ` or `### `, which covers `# ` and `#### `;
   - starts with `* ` or `+ `, which are list markers this format does not use;
   - contains `![`, which is an image;
   - matches `/<[A-Za-z/!]/`, which is HTML. Text such as `a < b` is fine.
6. **Classify each group by its first line:**
   - `## text` gives `{ t: "h", level: 2 }` and `### text` gives level 3. Parse the text after the marker as inlines. The `id` is `slugify(` the plain text of those inlines `)`. If the id is `""`, throw. If two headings in one `md` call have the same id, throw `prose: duplicate heading id "<id>"`.
   - `- text` gives `ul`. `1. text`, or any `/^\d+\. /`, gives `ol`. Each line that starts with the marker begins a new item. A line that starts with whitespace continues the item before it. Trim it and join it to that item with one space. A continuation line whose trimmed text starts with `- ` or matches `/^\d+\. /` is a nested list, so throw `prose: nested list`. Any other line throws `` prose: missing blank line before "<line>" ``. Parse each item's text as inlines.
   - `> ` gives a callout. The first line must match `/^> (note|tradeoff|pitfall): /`. Any other first line throws `` prose: unknown callout kind "<line>" ``. Every later line in the group must start with `> `. Remove the `> ` from each line, and remove the `kind: ` from the first. Trim each line and join them with one space, then parse the result as inlines.
   - Anything else is a paragraph. Trim each line and join them with one space, then parse the result as inlines. If a later line in the group starts with `- `, `> ` or `/^\d+\. /`, throw `` prose: missing blank line before "<line>" ``.

#### How inlines parse

Read left to right. Merge adjacent `text` nodes into one.

- `` `code` `` gives `{ t: "code", v }` with `v` kept verbatim. A backtick that never closes throws. A U+E000 inside a code span throws `prose: cue inside code`.
- `**...**` gives `strong`. It ends at the next `**`. Parse its content as inlines, so it may hold em, code, links and cues.
- `*...*` gives `em`. It ends at the next `*`, and its content may not hold `**`. Parse its content as inlines.
- An opening `*` or `**` with no closing marker throws `prose: unclosed emphasis`. So a lone `*` in text throws. Write math such as `2 * 3` in a code span.
- `[text](url)` gives `link`. Parse `text` as inlines. `url` must start with `https://` or `#/`, or the link throws `prose: link must start with https:// or #/`. A `[` that does not start a complete `[text](url)` throws `` prose: unsupported syntax "<line>" ``.
- U+E000 gives `{ t: "cue", step, text }` from the next cue. The cue's text is never parsed.
- Added after review. The search for a closing `**`, `*` or `]` skips over code spans. An em that would close on the first star of a `**` throws `prose: unclosed emphasis`. A URL that holds a cue throws `prose: cue inside link url`. A URL with whitespace or `(` throws `prose: link url has a space or parenthesis`, so percent-encode those. After parsing, every cue must have been placed, or `md` throws.
- Everything else is text.

#### What `md` returns

- `blocks` holds the blocks in order.
- `cues` holds the `step` of every cue in reading order, duplicates kept.
- `words` is the sum, over all blocks, of `blockText(block).split(/\s+/).filter(Boolean).length`.

**`blockText(block)`** gives the plain text of a block. For inlines, `text` and `code` give `v`, `cue` gives `text`, and `strong`, `em` and `link` give the text of their children. Join the inlines with no separator. For a list, join the items' text with `\n`. A code block gives `v`.

**`slugify(text)`** lowercases the text. Then it replaces each run of characters that are not `a` to `z` or `0` to `9` with one `-`, and removes `-` from both ends. `slugify("Layer 7 load balancing")` is `layer-7-load-balancing`.

### `src/content/prose.typetest.ts` (new)

`tsc -b` compiles this file and nothing runs it. Write it exactly like this:

```ts
import { makeCue, md } from "./prose"

const cue = makeCue<"pick">()

export const ok = () => md`Text with ${cue("pick", "a cue")}.`

// @ts-expect-error md accepts only cue tokens
export const bad1 = () => md`Text with ${"a plain string"}.`

// @ts-expect-error cue accepts only the lesson's step ids
export const bad2 = () => md`Text with ${cue("pik", "a typo")}.`
```

### `src/content/prose.test.ts` (new)

Vitest, node environment. Make one `cue` with `makeCue<string>()` at the top. Check exact trees with `toEqual`. Use these exact test names:

1. `dedents a template indented by 4`. A template whose lines are indented by 4 spaces, with a code block that indents one line by 2 more, gives the same tree as the same text with no indent. The code line keeps its 2 spaces.
2. `splits paragraphs on blank lines and joins soft-wrapped lines`. `one`, `two`, a blank line, then `three` gives two paragraphs, with text `one two` and `three`.
3. `h2 and h3 with slug ids`. `## What it does` gives `{ t: "h", level: 2, id: "what-it-does", c: [{ t: "text", v: "What it does" }] }`. Check a `###` heading too.
4. `duplicate heading id throws`. Two `## Same` headings throw `duplicate heading id "same"`.
5. `h1 and h4 throw`. Both `# Title` and `#### Deep` throw `unsupported syntax`.
6. `ul and ol items`. A `ul` with three items, where one has a continuation line, and an `ol` with two items.
7. `callout note/tradeoff/pitfall`. Each kind gives the right `kind`. One callout spans two `> ` lines.
8. `unknown callout kind throws`. `> warning: x` and `> just a quote` both throw `unknown callout kind`.
9. `fenced code keeps content verbatim`. A block with `lang` `ts`, a blank line inside, and `**not bold**` inside gives `v` with all of it unchanged.
10. `unclosed code fence throws`.
11. `strong, em, code, link inline`. One paragraph with all four gives the exact inline list.
12. `nested strong inside link`. `[**bold** link](https://example.com)` gives a link whose `c` is a strong node then a text node.
13. `link must start with https:// or #/`. `http://x.com` throws. `#/learn/cdn` parses.
14. `unclosed emphasis throws`. `a * b` and `**open` both throw.
15. `cue becomes {t: cue, step, text} in position`. ``A ${cue("pick", "picks one")} server.`` gives text `A `, the cue, then text ` server.`.
16. `cues list in reading order`. Cues in a paragraph, a list item and a callout come out in that order, and a repeated step appears twice.
17. `cue inside code throws`. A cue inside a fenced code block throws, and so does a cue inside a code span.
18. `non-cue interpolation throws`. Call `md` with a plain object cast through `unknown` to `CueToken`. It throws `interpolation is not a cue`.
19. `image syntax throws`. `![alt](https://x.com/a.png)` throws `unsupported syntax`.
20. `raw HTML throws`. `<div>x</div>` and `a <br> b` throw. `a < b` parses. `` `List<String>` `` in a code span parses.
21. `table row throws`. `| a | b |` throws.
22. `nested list throws`. A `- ` item followed by `  - inner` throws `nested list`.
23. `word count counts text, cue text and code`. Pick a template with a known count, including a cue whose text has two words, an inline code span and a code block, and check the exact `words`.
24. `blockText flattens inlines`. A paragraph with strong, em, code, a link and a cue gives the plain text, and a list joins items with `\n`.
25. `slugify: 'Layer 7 load balancing' -> 'layer-7-load-balancing'`. Also check `slugify("  What's new?  ")` is `what-s-new`.
26. `parses the load-balancer lesson body`. Copy the `md` template body from `docs/design/example-lesson/lesson.ts`, lines 86 to 116, into the test, indentation included, and parse it with the test's `cue`. The block kinds in order are `h, p, p, ul, callout, h, p, h, p, callout, p`. `cues` is `["arrive", "pick", "reply", "fail", "next", "scale", "stateless", "reroute"]`. The first heading's id is `what-it-does`. The second callout's `kind` is `tradeoff`.

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm build`. Its Vitest run of `src/content` shows 2 files and 38 tests before the Vite build.
3. `pnpm test`, which shows 4 files and 56 tests passing. Review added four tests: `code keeps backslashes`, `cue inside a link url throws`, `link url with a space or parenthesis throws` and `emphasis markers inside code spans do not close emphasis`.
4. `pnpm e2e`, which shows 4 tests passing.

## Prove the type test works

After the commands pass, in `prose.typetest.ts` change `"a plain string"` in `bad1` to `cue("pick", "fixed")`. Run `pnpm build`. It fails with `Unused '@ts-expect-error' directive`. Undo the change.

## Done means

- All four commands exit 0.
- `git status` shows only the three new files under `src/content/`.
- `package.json` and `pnpm-lock.yaml` are unchanged.
- `src/content/prose.ts` has one `as` cast, in `makeCue`, and no `any` and no `!` non-null assertion.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Show the first failing run of `prose.test.ts`, from before `prose.ts` existed. Paste the failing output of the type test check. Say whether you hit anything the spec did not cover, and what you did about it.
