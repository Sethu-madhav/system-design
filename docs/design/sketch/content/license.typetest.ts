// src/content/license.typetest.ts
//
// Compiled by `tsc -b`, never run. If the license type ever stops rejecting these,
// the @ts-expect-error lines become unused and tsc fails the build.
// Each bad case is one line: tsc reports union mismatches on different lines
// depending on the case, and a one-line object keeps the directive on target.

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

// @ts-expect-error CC BY-NC-ND: link only
export const bad1: SourceRef = { use: "adapted", repo: "ByteByteGoHq/system-design-101", section: "x", anchor: "x" }

// @ts-expect-error MIT repo is "link", not "adapt"
export const bad2: SourceRef = { use: "adapted", repo: "binhnguyennus/awesome-scalability", section: "x", anchor: "x" }

// @ts-expect-error not in the registry at all
export const bad3: SourceRef = { use: "adapted", repo: "someone/random", section: "x", anchor: "x" }
