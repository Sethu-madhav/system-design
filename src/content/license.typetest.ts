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
