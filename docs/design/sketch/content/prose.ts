// src/content/prose.ts
//
// Owns: the lesson prose format. Authors write markdown inside an `md` tagged
// template; the only interpolations allowed are cue tokens, which tie a phrase in
// the text to a scene step. Parsing happens once, at module load, into a small
// AST. Rendering (React) and search (plain text) both read the AST, so neither
// ever sees markdown.
//
// Supported subset (anything else throws at load, which fails content.test.ts):
//   ## Heading / ### Heading      -> h2/h3, id = slug(text), unique per lesson
//   blank-line separated paragraphs
//   - item / 1. item              -> ul / ol, one level only
//   > note: ... / > tradeoff: ... / > pitfall: ...  -> callout
//   ``` fenced code ```
//   inline: **strong**, *em*, `code`, [text](https://url), ${cue("step", "text")}
// Not supported, by design: images (`![`), raw HTML, tables, nested lists.
// No image syntax means a lesson cannot embed a copied source image.

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
  /** Step ids referenced by cues, in reading order. Derived during parse. */
  readonly cues: readonly string[]
  readonly words: number
}

/** Opaque token produced by `cue`; only the parser can read it. */
declare const cueBrand: unique symbol
export interface CueToken<S extends string = string> {
  readonly [cueBrand]: S
}

export type CueFn<S extends string> = (step: S, text: string) => CueToken<S>

/** Makes the typed `cue` function handed to a lesson's `body` callback. */
export function makeCue<S extends string>(): CueFn<S> {
  throw new Error("not implemented")
}

/**
 * Tagged template. Interpolations must be CueTokens (enforced by the parameter type,
 * so `${someString}` is a tsc error).
 */
export function md(_strings: TemplateStringsArray, ..._cues: CueToken[]): Prose {
  // TODO:
  // 1. dedent: strip the common leading whitespace of non-empty lines.
  // 2. join strings with sentinel "<i>" in place of each cue.
  // 3. split into blocks on blank lines; classify each block by its first chars.
  //    Throw `prose: unsupported syntax "<line>"` on "![", "<", "|", nested "  -".
  // 4. parse inlines left to right; when a sentinel is met, emit {t:"cue"} from cues[i].
  // 5. slug headings; throw on duplicate id.
  // 6. count words over text/code/cue text.
  throw new Error("not implemented")
}

/** Plain text of a block, for search and reading time. */
export function blockText(_b: Block): string {
  throw new Error("not implemented")
}

export function slugify(_text: string): string {
  throw new Error("not implemented")
}
