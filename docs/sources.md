# Content sources and what the license allows

The app's lessons are original text. Facts and concepts, such as how consistent hashing works, are not protected by copyright. The wording, the diagrams, and the structure of a source are. Each source below has a rule that says what a lesson may take from it.

Data checked on 2026-11-01 from `https://api.github.com/repos/<owner>/<repo>` and each repo's license file.

## Sources

| Repo | Stars | License | Rule |
|---|---|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 376,462 | CC BY 4.0, from `LICENSE.txt` | Adapt. |
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | 75,286 | MIT | Link. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 90,918 | CC BY-NC-ND 4.0, from `LICENSE.md` | Link only. |
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | 46,746 | CC BY-NC-ND 4.0, from `LICENSE` | Link only. |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | 43,020 | GPL-3.0 | Link only. |
| [InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources) | 18,543 | GPL-3.0 | Link only. |
| [checkcheckzz/system-design-interview](https://github.com/checkcheckzz/system-design-interview) | 23,876 | None | Link only. |

## Rules

**Adapt.** A lesson may follow the source's topic order and paraphrase its explanations. The lesson's frontmatter names the source, links the source and the license, and says that the lesson changed the text. CC BY 4.0 requires all three. The app does not copy the source's images, because some primer images credit other authors under other terms. The app draws its own diagrams.

**Link.** A lesson may link the source in its further-reading list. MIT allows copying with the notice kept, but no lesson needs more than a link.

**Link only.** A lesson may link the source in its further-reading list. A lesson does not copy or paraphrase the source's text, diagrams, or structure.
- CC BY-NC-ND forbids sharing adapted versions.
- GPL-3.0 would put any copied text under GPL-3.0.
- A repo with no license grants no rights beyond viewing it on GitHub.

**AlgoMaster.** [algomaster.io](https://algomaster.io/learn/system-design) is a product reference for the kind of site we are building. The app does not copy its text, layout, diagrams, or animations.

## Who enforces the rules

Step 3 of the plan, the content pipeline, will add a required `sources` field to every lesson's frontmatter. Each entry will name a repo from the table above. The build will fail if a lesson cites a "Link only" repo as an adapted source.
