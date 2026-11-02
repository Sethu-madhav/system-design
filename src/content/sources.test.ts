import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, test } from "vitest"
import {
  CHANGE_NOTICE,
  SOURCES,
  attribution,
  parseSourcesTable,
  type SourceRef,
} from "./sources"

const primer: Extract<SourceRef, { use: "adapted" }> = {
  use: "adapted",
  repo: "donnemartin/system-design-primer",
  section: "Load balancer",
  anchor: "load-balancer",
}

const table = `# Title

| Repo | Stars | License | Rule |
|---|---|---|---|
| [owner/adapt](https://github.com/owner/adapt) | 1 | CC BY 4.0 | Adapt. |
| [owner/link](https://github.com/owner/link) | 2 | MIT | Link. |
| [owner/link-only](https://github.com/owner/link-only) | 3 | None | Link only. |

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
  })

  test("parseSourcesTable maps Adapt./Link./Link only.", () => {
    const rules = parseSourcesTable(table)
    expect(rules).toEqual(
      new Map([
        ["owner/adapt", "adapt"],
        ["owner/link", "link"],
        ["owner/link-only", "link-only"],
      ]),
    )
  })

  test("parseSourcesTable throws on an unknown rule", () => {
    const markdown = table.replace("| Adapt. |", "| Copy. |")
    expect(() => parseSourcesTable(markdown)).toThrow("Copy.")
  })

  test("parseSourcesTable throws when the table is missing", () => {
    expect(() => parseSourcesTable("No table here.\n\nJust prose.")).toThrow("Repo table not found")
  })

  test("every adapt repo has licenseUrl", () => {
    for (const info of Object.values(SOURCES)) {
      if (info.rule === "adapt") {
        expect(typeof info.licenseUrl).toBe("string")
        expect(info.licenseUrl.startsWith("https://")).toBe(true)
      }
    }
  })

  test("attribution names section, title, author, license, and the change notice", () => {
    const credit = attribution(primer)
    expect(credit.text).toBe(
      'Adapted from "Load balancer" in The System Design Primer by Donne Martin.',
    )
    expect(credit.license).toBe("CC BY 4.0")
    expect(credit.licenseUrl).toBe("https://creativecommons.org/licenses/by/4.0/")
    expect(credit.changed).toBe(CHANGE_NOTICE)
  })

  test("attribution sourceUrl is repo url + #anchor", () => {
    expect(attribution(primer).sourceUrl).toBe(
      "https://github.com/donnemartin/system-design-primer#load-balancer",
    )
  })
})
