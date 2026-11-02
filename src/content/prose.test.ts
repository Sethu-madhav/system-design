import { describe, expect, test } from "vitest"
import { blockText, makeCue, md, slugify, type CueToken } from "./prose"

const cue = makeCue<string>()

describe("prose", () => {
  test("dedents a template indented by 4", () => {
    const indented = md`
      ## Code

      \`\`\`ts
        const answer = 42
      \`\`\`

      Done.
    `
    const flat = md`
## Code

\`\`\`ts
  const answer = 42
\`\`\`

Done.
`
    expect(indented).toEqual(flat)
    expect(indented.blocks).toEqual([
      { t: "h", level: 2, id: "code", c: [{ t: "text", v: "Code" }] },
      { t: "code", lang: "ts", v: "  const answer = 42" },
      { t: "p", c: [{ t: "text", v: "Done." }] },
    ])
  })

  test("splits paragraphs on blank lines and joins soft-wrapped lines", () => {
    const prose = md`
one
two

three
`
    expect(prose.blocks).toEqual([
      { t: "p", c: [{ t: "text", v: "one two" }] },
      { t: "p", c: [{ t: "text", v: "three" }] },
    ])
  })

  test("h2 and h3 with slug ids", () => {
    const prose = md`
## What it does

### Deep dive
`
    expect(prose.blocks).toEqual([
      { t: "h", level: 2, id: "what-it-does", c: [{ t: "text", v: "What it does" }] },
      { t: "h", level: 3, id: "deep-dive", c: [{ t: "text", v: "Deep dive" }] },
    ])
  })

  test("duplicate heading id throws", () => {
    expect(() => md`
## Same

## Same
`).toThrow('prose: duplicate heading id "same"')
  })

  test("h1 and h4 throw", () => {
    expect(() => md`
# Title
`).toThrow("prose: unsupported syntax")
    expect(() => md`
#### Deep
`).toThrow("prose: unsupported syntax")
  })

  test("ul and ol items", () => {
    const prose = md`
- one
- two
  wraps here
- three

1. first
2. second
`
    expect(prose.blocks).toEqual([
      {
        t: "ul",
        items: [
          [{ t: "text", v: "one" }],
          [{ t: "text", v: "two wraps here" }],
          [{ t: "text", v: "three" }],
        ],
      },
      {
        t: "ol",
        items: [[{ t: "text", v: "first" }], [{ t: "text", v: "second" }]],
      },
    ])
  })

  test("callout note/tradeoff/pitfall", () => {
    const prose = md`
> note: A note.

> tradeoff: A tradeoff.

> pitfall: A pitfall
> spans lines.
`
    expect(prose.blocks).toEqual([
      { t: "callout", kind: "note", c: [{ t: "text", v: "A note." }] },
      { t: "callout", kind: "tradeoff", c: [{ t: "text", v: "A tradeoff." }] },
      { t: "callout", kind: "pitfall", c: [{ t: "text", v: "A pitfall spans lines." }] },
    ])
  })

  test("unknown callout kind throws", () => {
    expect(() => md`
> warning: x
`).toThrow("prose: unknown callout kind")
    expect(() => md`
> just a quote
`).toThrow("prose: unknown callout kind")
  })

  test("fenced code keeps content verbatim", () => {
    const prose = md`
\`\`\`ts
const a = 1

**not bold**
\`\`\`
`
    expect(prose.blocks).toEqual([
      { t: "code", lang: "ts", v: "const a = 1\n\n**not bold**" },
    ])
  })

  test("unclosed code fence throws", () => {
    expect(() => md`
\`\`\`ts
const a = 1
`).toThrow("prose: unclosed code fence")
  })

  test("strong, em, code, link inline", () => {
    const prose = md`
**bold** *em* \`code\` [link](https://example.com)
`
    expect(prose.blocks).toEqual([
      {
        t: "p",
        c: [
          { t: "strong", c: [{ t: "text", v: "bold" }] },
          { t: "text", v: " " },
          { t: "em", c: [{ t: "text", v: "em" }] },
          { t: "text", v: " " },
          { t: "code", v: "code" },
          { t: "text", v: " " },
          { t: "link", href: "https://example.com", c: [{ t: "text", v: "link" }] },
        ],
      },
    ])
  })

  test("nested strong inside link", () => {
    const prose = md`
[**bold** link](https://example.com)
`
    expect(prose.blocks).toEqual([
      {
        t: "p",
        c: [
          {
            t: "link",
            href: "https://example.com",
            c: [{ t: "strong", c: [{ t: "text", v: "bold" }] }, { t: "text", v: " link" }],
          },
        ],
      },
    ])
  })

  test("link must start with https:// or #/", () => {
    expect(() => md`
[x](http://x.com)
`).toThrow("prose: link must start with https:// or #/")
    expect(md`
[cdn](#/learn/cdn)
`).toEqual({
      blocks: [
        {
          t: "p",
          c: [{ t: "link", href: "#/learn/cdn", c: [{ t: "text", v: "cdn" }] }],
        },
      ],
      cues: [],
      words: 1,
    })
  })

  test("unclosed emphasis throws", () => {
    expect(() => md`
a * b
`).toThrow("prose: unclosed emphasis")
    expect(() => md`
**open
`).toThrow("prose: unclosed emphasis")
  })

  test("cue becomes {t: cue, step, text} in position", () => {
    const prose = md`A ${cue("pick", "picks one")} server.`
    expect(prose.blocks).toEqual([
      {
        t: "p",
        c: [
          { t: "text", v: "A " },
          { t: "cue", step: "pick", text: "picks one" },
          { t: "text", v: " server." },
        ],
      },
    ])
    expect(prose.cues).toEqual(["pick"])
  })

  test("cues list in reading order", () => {
    const prose = md`
${cue("a", "one")} text

- item ${cue("b", "two")}

> note: call ${cue("a", "again")}
`
    expect(prose.cues).toEqual(["a", "b", "a"])
  })

  test("cue inside code throws", () => {
    expect(() => md`
\`\`\`
${cue("x", "y")}
\`\`\`
`).toThrow("prose: cue inside code")
    expect(() => md`
text \`${cue("x", "y")}\` more
`).toThrow("prose: cue inside code")
  })

  test("non-cue interpolation throws", () => {
    const fake = {} as unknown as CueToken
    expect(() => md`Text with ${fake}.`).toThrow("prose: interpolation is not a cue")
  })

  test("image syntax throws", () => {
    expect(() => md`
![alt](https://x.com/a.png)
`).toThrow("prose: unsupported syntax")
  })

  test("raw HTML throws", () => {
    expect(() => md`
<div>x</div>
`).toThrow("prose: unsupported syntax")
    expect(() => md`
a <br> b
`).toThrow("prose: unsupported syntax")
    expect(md`
a < b
`).toEqual({ blocks: [{ t: "p", c: [{ t: "text", v: "a < b" }] }], cues: [], words: 3 })
    expect(md`
\`List<String>\`
`).toEqual({ blocks: [{ t: "p", c: [{ t: "code", v: "List<String>" }] }], cues: [], words: 1 })
  })

  test("table row throws", () => {
    expect(() => md`
| a | b |
`).toThrow("prose: unsupported syntax")
  })

  test("nested list throws", () => {
    expect(() => md`
- outer
  - inner
`).toThrow("prose: nested list")
  })

  test("word count counts text, cue text and code", () => {
    const prose = md`
## Word count

Hello world ${cue("go", "two words")} and \`inline code\`.

\`\`\`ts
const value = 1
\`\`\`
`
    expect(prose.words).toBe(13)
  })

  test("blockText flattens inlines", () => {
    const prose = md`
A **bold** *em* \`code\` [link](https://example.com) ${cue("go", "cue text")}.
`
    expect(blockText(prose.blocks[0])).toBe("A bold em code link cue text.")
    expect(
      blockText(
        md`
- one
- two
`.blocks[0],
      ),
    ).toBe("one\ntwo")
  })

  test("slugify: 'Layer 7 load balancing' -> 'layer-7-load-balancing'", () => {
    expect(slugify("Layer 7 load balancing")).toBe("layer-7-load-balancing")
    expect(slugify("  What's new?  ")).toBe("what-s-new")
  })

  test("parses the load-balancer lesson body", () => {
    const prose = md`
    ## What it does

    A load balancer sits in front of a group of servers. ${cue("arrive", "Clients talk to the balancer")},
    and ${cue("pick", "it forwards each request to one server")} and
    ${cue("reply", "relays the answer back")}. Clients never learn which server did the work.

    It earns its place three ways:

    - It ${cue("fail", "stops sending requests to unhealthy servers")}.
    - It spreads load so ${cue("next", "no single server gets all of it")}.
    - It removes the single server as a single point of failure.

    > note: The balancer itself can now be the single point of failure. Teams run two, in active-passive or active-active mode.

    ## How it picks a server

    Common rules are random, least loaded, round robin (optionally weighted), and
    session cookies. A **layer 4** balancer decides from IP addresses and ports
    only. A **layer 7** balancer reads the request itself, its path, headers, and
    cookies, so it can send \`/video\` to video servers and \`/billing\` to hardened
    ones. Layer 7 costs more work per request.

    ## Horizontal scaling

    ${cue("scale", "Adding cheap servers behind the balancer")} is called scaling out.
    It is cheaper and more available than buying one bigger machine, which is
    scaling up.

    > tradeoff: Scaling out only works if ${cue("stateless", "servers hold no user session")}. Keep sessions in a shared database or cache.

    ${cue("reroute", "Losing a server then costs capacity, not correctness")}.
  `
    expect(prose.blocks.map((block) => block.t)).toEqual([
      "h",
      "p",
      "p",
      "ul",
      "callout",
      "h",
      "p",
      "h",
      "p",
      "callout",
      "p",
    ])
    expect(prose.cues).toEqual([
      "arrive",
      "pick",
      "reply",
      "fail",
      "next",
      "scale",
      "stateless",
      "reroute",
    ])
    expect(prose.blocks[0]).toMatchObject({ t: "h", id: "what-it-does" })
    expect(prose.blocks[9]).toMatchObject({ t: "callout", kind: "tradeoff" })
  })
})
