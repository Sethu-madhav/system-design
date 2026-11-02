# Step 1: test tooling

## Goal

Install Vitest and Playwright and wire them into the project, with one passing smoke test each. The app in the browser does not change. Every later step depends on these commands:

- `pnpm test` runs the Vitest unit tests.
- `pnpm e2e` builds the app, serves it with `vite preview` on port 4173, and runs the Playwright tests in Chromium.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it.
- Run `pnpm install` first.
- Do not edit anything under `src/lib/`, `src/components/` or `vendor/`.
- Do not add code comments, except the one `/// <reference ... />` line below.

## Files

### `package.json`

Add dev dependencies with these commands:

```bash
pnpm add -D vitest@^3 @playwright/test
```

Vitest 3 supports the project's Vite 6. Do not install Vitest 4.

Add these scripts. Keep the existing `dev`, `build` and `preview` scripts unchanged.

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

### `vite.config.ts`

Add `/// <reference types="vitest/config" />` as the first line. Add a `test` block to the config object:

```ts
test: {
  environment: "node",
  include: ["src/**/*.test.ts"],
},
```

Keep the existing `plugins` and `resolve.alias` unchanged. Unit tests rely on the `@` alias.

### `playwright.config.ts` (new, repo root)

- `testDir: "e2e"`.
- `projects`: one project named `chromium`, using `devices["Desktop Chrome"]`.
- `use.baseURL`: `"http://localhost:4173"`.
- `webServer.command`: `"pnpm build && pnpm preview --port 4173 --strictPort"`.
- `webServer.url`: `"http://localhost:4173"`.
- `webServer.reuseExistingServer`: `!process.env.CI`.
- `webServer.timeout`: `120_000`.
- `forbidOnly`: `!!process.env.CI`.
- `retries`: `process.env.CI ? 1 : 0`.
- `reporter`: `"list"`.

### `e2e/fixtures.ts` (new)

Export `test` and `expect`. `test` is the Playwright `test` extended so that the `page` fixture records console errors.

- Before the test runs, listen to `page.on("console")`, and push the text of every message whose `type()` is `"error"` into an array.
- Also listen to `page.on("pageerror")` and push `error.message` into the same array.
- Expose the array as a second fixture named `consoleErrors: string[]`.
- Export an async helper `gotoReady(page: Page, path: string)`. It calls `page.goto(path)`, then waits for `document.fonts.ready` with `page.evaluate(() => document.fonts.ready.then(() => undefined))`.

Every later spec file imports `test`, `expect` and `gotoReady` from `./fixtures`, never from `@playwright/test`.

### `e2e/smoke.spec.ts` (new)

One test named `app boots and renders a root element`:

1. `await gotoReady(page, "/")`.
2. Expect `page.locator("#root > *")` to have a count greater than 0. Use `expect.poll` or `toHaveCount`, not a fixed wait.
3. Expect `consoleErrors` to equal `[]`.

### `src/smoke.test.ts` (new)

One Vitest test named `vitest runs and resolves the @ alias`. It imports `cn` from `@/lib/utils` and expects `cn("a", false && "b", "c")` to equal `"a c"`.

Check that `src/lib/utils.ts` exports `cn` before you write the test. If it doesn't, stop and report that, rather than picking another import.

### `tsconfig.json`

Change `include` to `["src", "e2e", "vite.config.ts", "playwright.config.ts"]`. Change nothing else.

### `.gitignore`

Add these lines under a `# Test output` heading:

```
test-results
playwright-report
```

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm exec playwright install chromium`
3. `pnpm build`
4. `pnpm test`, which shows 1 file and 1 test passing.
5. `pnpm e2e`, which shows 1 test passing in the `chromium` project.

## Done means

- All five commands exit 0.
- `git status` shows only the files listed above, plus `pnpm-lock.yaml`.
- There is no `package-lock.json`, `yarn.lock` or `bun.lockb`.
- `pnpm dev` still shows the existing playground page, unchanged.

## Report

List every file you changed. Paste the output of commands 3, 4 and 5. Say whether you hit anything the spec did not cover, and what you did about it.
