import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, test } from "vitest"
import { SOURCES, parseSourcesTable } from "./sources"

const table = `# Title

| Repo | Stars | License | Rule |
|---|---|---|---|
| [owner/link](https://github.com/owner/link) | 1 | MIT | Link. |
| [owner/link-only](https://github.com/owner/link-only) | 2 | None | Link only. |

A paragraph after the table.
`

describe("sources", () => {
  test("registry matches docs/sources.md", () => {
    const markdown = readFileSync(resolve(process.cwd(), "docs/sources.md"), "utf8")
    const documented = parseSourcesTable(markdown)
    const code = new Map<string, string>(Object.entries(SOURCES).map(([key, info]) => [key, info.rule]))

    expect([...documented.keys()].sort()).toEqual([...code.keys()].sort())
    for (const [key, rule] of code) {
      expect(documented.get(key)).toBe(rule)
    }
    for (const [key, rule] of documented) {
      expect(code.get(key)).toBe(rule)
    }
    for (const [key, info] of Object.entries(SOURCES)) {
      expect(info.url).toBe(`https://github.com/${key}`)
    }
  })

  test("parseSourcesTable maps Link. and Link only.", () => {
    const rules = parseSourcesTable(table)
    expect(rules).toEqual(
      new Map([
        ["owner/link", "link"],
        ["owner/link-only", "link-only"],
      ]),
    )
  })

  test("parseSourcesTable throws on an unknown rule", () => {
    expect(() => parseSourcesTable(table.replace("| Link. |", "| Copy. |"))).toThrow("Copy.")
    expect(() => parseSourcesTable(table.replace("| Link. |", "| Adapt. |"))).toThrow("Unknown rule: Adapt.")
  })

  test("parseSourcesTable throws when the table is missing", () => {
    expect(() => parseSourcesTable("No table here.\n\nJust prose.")).toThrow("Repo table not found")
  })

  test("parseSourcesTable throws on a malformed table", () => {
    expect(() => parseSourcesTable(table.replace("|---|---|---|---|\n", ""))).toThrow("separator")
    expect(() => parseSourcesTable(table.replace("[owner/link](https://github.com/owner/link)", "owner/link"))).toThrow("Malformed")
    expect(() => parseSourcesTable(table.replace("[owner/link]", "[owner/link-only]"))).toThrow("Duplicate Repo row: owner/link-only")
  })
})
