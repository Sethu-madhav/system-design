import type { SourceRef } from "./sources"

export const primerAsLink: SourceRef = {
  use: "link",
  repo: "donnemartin/system-design-primer",
  title: "The System Design Primer: load balancer",
  url: "https://github.com/donnemartin/system-design-primer#load-balancer",
}

export const linkOnlyAsLink: SourceRef = {
  use: "link",
  repo: "ByteByteGoHq/system-design-101",
  title: "System Design 101",
  url: "https://github.com/ByteByteGoHq/system-design-101",
}

// @ts-expect-error no repo may be adapted, the primer included
export const adaptPrimer: SourceRef = { use: "adapted", repo: "donnemartin/system-design-primer", title: "x", url: "https://example.com" }

// @ts-expect-error CC BY-NC-ND repo is link only
export const adaptLinkOnly: SourceRef = { use: "adapted", repo: "ByteByteGoHq/system-design-101", title: "x", url: "https://example.com" }

// @ts-expect-error repo is not in the registry
export const unknownRepo: SourceRef = { use: "link", repo: "someone/random", title: "x", url: "https://example.com" }
