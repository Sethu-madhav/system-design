import { readFileSync } from "node:fs"
import { describe, expect, test } from "vitest"

const indexCss = readFileSync("src/index.css", "utf8")
const themeCss = readFileSync("src/styles/theme.css", "utf8")

function block(css: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {}
  let start = css.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`no block for ${selector}`)
  while (start >= 0) {
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start))
    for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[match[1]] = match[2].trim()
    start = css.indexOf(`\n${selector} {`, start + 1)
  }
  return out
}

const light = { ...block(indexCss, ":root"), ...block(themeCss, ":root, [data-theme], [data-ll-scope]") }
const dark = {
  ...light,
  ...block(themeCss, ":root.dark"),
  ...block(themeCss, ":root.dark, .dark [data-theme], .dark [data-ll-scope]"),
}

function resolve(vars: Record<string, string>, name: string): [number, number, number] {
  let value = vars[name]
  for (let i = 0; value?.startsWith("var("); i += 1) {
    if (i > 10) throw new Error(`cycle at ${name}`)
    value = vars[value.slice(4, -1).trim()]
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(value ?? "")
  if (!hex) throw new Error(`${name} is not a plain hex color: ${value}`)
  const n = parseInt(hex[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrast(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const SURFACES = ["--surface-page", "--surface-elevated", "--ll-slip", "--ll-pad"]
const PAPER = ["--surface-elevated", "--ll-slip", "--ll-pad"]
// Body text can sit on the page. Links and pencil notes only appear on paper.
const TEXT: [string, string[]][] = [
  ["--text-primary", SURFACES],
  ["--text-secondary", SURFACES],
  ["--ll-ink-you", PAPER],
  ["--ll-pencil-text", PAPER],
]
const ON_COLOR: [string, string][] = [
  ["--text-on-brand", "--accent-brand"],
  ["--text-inverse", "--status-destructive"],
]

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme contrast", (_, vars) => {
  for (const [text, surfaces] of TEXT) {
    for (const surface of surfaces) {
      test(`${text} on ${surface} is at least 4.5:1`, () => {
        expect(contrast(resolve(vars, text), resolve(vars, surface))).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
  for (const [text, surface] of ON_COLOR) {
    test(`${text} on ${surface} is at least 4.5:1`, () => {
      expect(contrast(resolve(vars, text), resolve(vars, surface))).toBeGreaterThanOrEqual(4.5)
    })
  }
})
