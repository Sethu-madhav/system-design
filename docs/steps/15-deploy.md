# Step 15: deploy to GitHub Pages

## Goal

The app is public at `https://sethu-madhav.github.io/system-design/` and looks the same as it does locally. Every pull request runs the build, the unit tests and the full Playwright suite in GitHub Actions. Every push to `main` runs the same checks and then deploys `dist` to Pages.

A reader sees:

- the browser tab titled "Learn system design", with an ink favicon;
- the home page and the load-balancer lesson working under the `/system-design/` path.

## What changes from the design

Read this before the code. The prototype behind every number here ran on a throwaway worktree off `main` at 370a77d.

- **No new unit test.** The design asked for a routes test named "href output has no leading slash path (base-independent)". `src/app/routes.test.ts:115` already has "href output starts with #/", which checks the same thing for every route shape. A second copy adds nothing.
- **The bundle is split into three chunks, and the warning limit is 700 kB.** On `main` the build emits one JS file of 1,095 kB (489 kB gzip) and warns about a chunk over 500 kB. A per-module count put 697 kB of that in `src/lib/ink`, mostly inline texture data (`textures-paper.generated.ts` 176 kB, `textures.generated.ts` 91 kB, `art/glyphs.ts` 71 kB). `src/lib/ink` is vendored Looseleaf code and this step does not edit it. Every page draws paper, so lazy loading would not shrink the first load. The split is still worth having, because each step after this one adds a lesson. A lesson-only change then re-downloads the 56 kB app chunk and keeps the cached `vendor` and `ink` chunks. The prototype's build output:

  | Chunk | Size | gzip |
  | :--- | ---: | ---: |
  | `index` (app and lessons) | 55.70 kB | 19.75 kB |
  | `vendor` (`node_modules`) | 380.23 kB | 121.50 kB |
  | `ink` (`src/lib/ink` and `src/components/ui`) | 659.96 kB | 346.03 kB |

  The `ink` chunk is still over 500 kB. The limit goes to 700 kB, not higher, so the warning comes back if that chunk grows by another 40 kB.
- **A second preview server checks the `/system-design/` path.** Playwright starts its `webServer` entries one after another. The first entry builds and serves on 4173 as today. The second serves the same `dist` on 4174 with `--base /system-design/`. The prototype ran the full suite three times. The first run had one failure, a console error `Failed to load resource: net::ERR_TIMED_OUT` in the existing test "ink is not regenerated during play". The only remote resource is the Kevin Sans font from `kevintngo.github.io`, so the likely cause is a network blip, but that is a guess. The next two runs passed 46 of 46. CI already retries a failed test once (`retries: process.env.CI ? 1 : 0`).
- **`/favicon.svg` in `index.html` becomes `./favicon.svg` in `dist`.** Vite rewrites root paths in `index.html` with the base. The prototype's built `index.html` had `href="./favicon.svg"`.
- **Opus turns on Pages and you write no secrets.** `gh api repos/Sethu-madhav/system-design/pages` returns 404 today, so Pages is off. Opus runs `gh api -X POST repos/Sethu-madhav/system-design/pages -f build_type=workflow` after the pull request's CI run is green and before the merge. The deploy job uses the built-in `GITHUB_TOKEN`. Codex does not run that command and does not push.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src` or `vendor`. Do not add packages.
- Do not add code comments. The existing `// https://vite.dev/config/` line in `vite.config.ts` stays as it is.
- Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.

## Files

Change exactly these 6 files:

| File | Change |
| :--- | :--- |
| `vite.config.ts` | `base`, chunk split, warning limit |
| `playwright.config.ts` | a second `webServer` entry |
| `index.html` | title, description, favicon link |
| `public/favicon.svg` | new |
| `.github/workflows/deploy.yml` | new |
| `e2e/deploy.spec.ts` | new, 1 test |

### `vite.config.ts`

Add `base` and `build` above `plugins`. Change nothing else.

```ts
export default defineConfig({
  base: "./",
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/")) return "vendor"
          if (id.includes("/src/lib/ink/") || id.includes("/src/components/ui/")) return "ink"
          return undefined
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
```

`base: "./"` is safe because routing is by hash (`docs/plan.md`, Decisions). Every asset path in `dist` is relative, so the same build works at `/` and at `/system-design/`.

### `playwright.config.ts`

`webServer` becomes an array. The first entry is today's object, unchanged. Add the second after it.

```ts
  webServer: [
    {
      command: "pnpm build && pnpm preview --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "pnpm preview --port 4174 --strictPort --base /system-design/",
      url: "http://localhost:4174/system-design/",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
```

The order matters. The second entry serves the `dist` that the first entry builds.

### `index.html`

The `<head>` becomes exactly this. The `<body>` stays as it is.

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Learn system design with lesson text, step-by-step hand-drawn diagrams and quizzes." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Learn system design</title>
  </head>
```

### `public/favicon.svg`

A hand-drawn box with an arrow into it, in ink colour. The file is exactly this, ending with one newline.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#2b2a28" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 9.2c3.6-.4 8.9-.3 12.1.2.4 4.4.5 9.3.1 13.4-3.9.5-8.6.4-12.3 0-.5-4.3-.4-9.3.1-13.6z"/><path d="M3 16.3c3.1-.2 6.4-.1 9.1 0"/><path d="M9.4 12.9c1.2 1.1 2.3 2.2 3 3.3-.8 1.2-1.9 2.3-3.1 3.3"/></svg>
```

### `.github/workflows/deploy.yml`

The file is exactly this. Each action tag is its latest release on 2026-11-03, read from `gh api repos/<action>/releases/latest`. pnpm 12.16.1 and Node 26 are the versions this repo is built with locally.

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
        with:
          version: 12.16.1
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm test
      - run: pnpm e2e
        env:
          CI: true
      - if: github.event_name != 'pull_request'
        uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: check
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

`pnpm e2e` builds `dist` again through the first `webServer` entry. The rebuild gives the same files, so the upload after it is the checked build.

### `e2e/deploy.spec.ts`

One test, named exactly "app works when served under /system-design/". It uses `test`, `expect` and `gotoReady` from `./fixtures`, so any console error fails it, including a 404 on a script or stylesheet.

1. Before navigating, record every response with status 400 or above as `"<status> <url>"`.
2. `gotoReady(page, "http://localhost:4174/system-design/")`.
3. The page title is exactly "Learn system design".
4. `meta[name="description"]` has the `content` from `index.html` above.
5. The heading "Learn system design" is visible.
6. Read the `href` property (the resolved URL) of `link[rel="icon"]`. It equals `http://localhost:4174/system-design/favicon.svg`. `page.request.get` on it returns status 200 and a `content-type` that contains `svg`.
7. Every resource entry from `performance.getEntriesByType("resource")` whose name contains `/assets/` starts with `http://localhost:4174/system-design/assets/`, and there is at least one.
8. Click the first link named `/Load balancer/`. The URL becomes exactly `http://localhost:4174/system-design/#/learn/load-balancer`, and `scene` is visible.
9. The list of failed responses is `[]`.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 68 tests passing. The output lists exactly three JS files in `dist/assets`, named `index-*.js`, `vendor-*.js` and `ink-*.js`. It has no "Some chunks are larger than" line.
3. `pnpm test` shows 186 tests passing in 14 files, the same as before.
4. `pnpm e2e` shows 46 tests passing. That is the 45 from before plus this 1. Run it 3 times in a row. All 3 runs must pass. If a run fails only on `net::ERR_TIMED_OUT` for a font, report it and run once more. Do not change any test to hide it.
5. `pnpm dlx js-yaml .github/workflows/deploy.yml` exits 0. It only checks that the YAML parses. Opus checks the workflow itself on the pull request's CI run.

## Done means

- All five commands pass.
- `git status` shows only the 6 files in the Files table.
- `dist/index.html` has `href="./favicon.svg"` and only `./assets/` script and stylesheet paths.
- Each of these planted bugs makes the named check fail. Check each one, then put the code back:
  - removing `base: "./"` fails the deploy test;
  - deleting `public/favicon.svg` fails the deploy test;
  - changing the title back to `Looseleaf React Project` fails the deploy test;
  - removing the description `meta` fails the deploy test;
  - changing the second server's `--base /system-design/` to `--base /` fails the deploy test;
  - removing `chunkSizeWarningLimit` brings back the "Some chunks are larger than" line in `pnpm build`;
  - removing `manualChunks` leaves one JS file in `dist/assets` instead of three.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3, 4 (all three e2e runs) and 5. Paste the failing output of the seven planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.

## After Codex reports

These steps are Opus's, not Codex's.

1. Verify in the worktree as for every step.
2. Push the branch and open the pull request. The `check` job runs on it. It must pass. The `deploy` job is skipped on a pull request.
3. Turn on Pages with `gh api -X POST repos/Sethu-madhav/system-design/pages -f build_type=workflow`.
4. Merge. The push to `main` runs `check` and then `deploy`.
5. Open `https://sethu-madhav.github.io/system-design/`, then `#/learn/load-balancer`, and take a screenshot of each at 1280 and 390 px.
