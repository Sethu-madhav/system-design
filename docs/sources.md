# Content sources and what the license allows

The app's lessons and chapters are our own writing. Facts and concepts, such as how consistent hashing works, are not protected by copyright. The wording, the diagrams and the structure of a source are. No lesson adapts any source below. A lesson may only link a source in its further-reading list.

Stars and license types come from `https://api.github.com/repos/<owner>/<repo>`, checked on 2026-11-01. GitHub reported `NOASSERTION` for the primer, `system-design-101`, and `karanpratapsingh/system-design`, so their license types come from reading their license files.

## Sources

| Repo | Stars | License | Rule |
|---|---|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 376,462 | CC BY 4.0, from `LICENSE.txt` | Link. |
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | 75,286 | MIT | Link. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 90,918 | CC BY-NC-ND 4.0, from `LICENSE.md` | Link only. |
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | 46,746 | CC BY-NC-ND 4.0, from `LICENSE` | Link only. |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | 43,020 | GPL-3.0 | Link only. |
| [InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources) | 18,543 | GPL-3.0 | Link only. |
| [checkcheckzz/system-design-interview](https://github.com/checkcheckzz/system-design-interview) | 23,876 | None | Link only. |

## Rules

**Link.** A lesson may link the source in its further-reading list. It does not copy or paraphrase the text, and it does not follow the source's topic order. The licenses of these repos would allow more. CC BY 4.0 allows adapting with credit, and MIT allows copying with the notice kept. We choose to write every lesson ourselves, so no lesson page needs a credit section.

**Link only.** A lesson may link the source in its further-reading list. A lesson does not copy or paraphrase the source's text, diagrams, or structure. A redrawn version of a source's diagram counts as an adaptation, so lesson animations do not recreate a diagram from a "Link only" repo.
- CC BY-NC-ND forbids sharing adapted versions.
- GPL-3.0 would put any copied text under GPL-3.0 once the app is public. Step 15 deploys it.
- A repo with no license grants no rights beyond viewing it on GitHub.

**AlgoMaster.** [algomaster.io](https://algomaster.io/learn/system-design) is a product reference for the kind of site we are building. The app does not copy its text, layout, diagrams, or animations.

## Who enforces the rules

`src/content/sources.ts` holds the same table as code. Step 3 of `docs/plan.md` adds it. A test reads this file during `pnpm build` and fails the build if the two tables disagree. So a change to the table above needs the same change in `sources.ts`.

Every lesson has a required `sources` field, and every entry in it is a link. `src/content/license.typetest.ts` checks that an entry with `use: "adapted"` does not compile, for any repo. That check reads only the `sources` field, so it cannot catch a paraphrase. Opus compares each lesson against its sources when it reviews the lesson.
