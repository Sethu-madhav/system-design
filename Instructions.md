# Project Instructions & Guidelines

## Package Management & Tool Execution

- **Package Manager:** Always use **`pnpm`** (`pnpm install`, `pnpm add`, `pnpm remove`, `pnpm run <script>`).
- **Binary / Package Execution:** Always use **`pnpm dlx`** instead of `npx` for running one-off CLI packages or scaffolding tools.
- **Do Not Use:** Do not use `npm`, `npx`, `yarn`, or `bun`. Mixing package managers leads to conflicting lockfiles (`package-lock.json`), duplicate dependencies, and inconsistent resolution behaviors.

### Common Command Equivalents

| Action | Recommended Command | Avoid |
| :--- | :--- | :--- |
| Install dependencies | `pnpm install` | `npm install` |
| Add dependency | `pnpm add <pkg>` | `npm install <pkg>` |
| Add dev dependency | `pnpm add -D <pkg>` | `npm install -D <pkg>` |
| Run script | `pnpm <script>` or `pnpm run <script>` | `npm run <script>` |
| One-off CLI command | `pnpm dlx <pkg> [args]` | `npx <pkg> [args]` |
| Add Looseleaf component | `pnpm dlx shadcn@latest add @looseleaf/<component-name> -y` | `npx shadcn add <component-name>` |
| Remove dependency | `pnpm remove <pkg>` | `npm uninstall <pkg>` |

## Component Library (Looseleaf / shadcn)

- **Registry:** Configured with Looseleaf (`@looseleaf`) via `components.json`.
- **Add Components:** To add new hand-drawn Looseleaf components to the project, use `pnpm dlx`:
  ```bash
  pnpm dlx shadcn@latest add @looseleaf/<component-name> -y
  ```
  *(Examples: `@looseleaf/switch`, `@looseleaf/dialog`, `@looseleaf/accordion`, `@looseleaf/tabs`, `@looseleaf/tooltip`)*


## Writing curriculum, chapters and lessons

- Any agent that writes or edits `docs/curriculum.md`, a chapter, or lesson text, scenes and quizzes (in a spec under `docs/steps/` or in `src/content/lessons/`) must apply the unslop skill to that text before handing it back.
- Read `.agents/skills/unslop/SKILL.md` in full first. In Claude Code, run `/unslop` on the draft. In OpenCode, load the `unslop` skill.
- Check every rule in the skill against the draft and rewrite until none apply. Rule 13 (no em dashes) and rule 17 (sentence case headings) apply to every heading, quiz question and answer.
