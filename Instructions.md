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

