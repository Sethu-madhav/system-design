import { expect, test, gotoReady } from "./fixtures"

const path = "/#/learn/load-balancer"

test("Play sets data-mode=playing and a packet moves", async ({ page }) => {
  await gotoReady(page, `${path}/step/next`)
  const scene = page.getByTestId("scene")
  const packet = scene.locator("[data-scene-packet]").first()
  await page.getByRole("button", { name: "Play" }).click()
  await expect(scene).toHaveAttribute("data-mode", "playing")
  await expect(packet).toBeVisible()
  const before = await packet.boundingBox()
  await page.waitForTimeout(100)
  const after = await packet.boundingBox()
  if (before === null || after === null) throw new Error("packet has no box")
  expect(before.x).not.toBe(after.x)
})

test("Pause freezes the packet position", async ({ page }) => {
  await gotoReady(page, `${path}/step/next`)
  const scene = page.getByTestId("scene")
  const packet = scene.locator("[data-scene-packet]").first()
  await page.getByRole("button", { name: "Play" }).click()
  await expect(packet).toBeVisible()
  await page.getByRole("button", { name: "Pause" }).click()
  await expect(scene).toHaveAttribute("data-mode", "paused")
  const before = await packet.boundingBox()
  await page.waitForTimeout(300)
  const after = await packet.boundingBox()
  expect(after).toEqual(before)
})

test("Space toggles play when the player has focus", async ({ page }) => {
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  await scene.focus()
  await page.keyboard.press("Space")
  await expect(scene).toHaveAttribute("data-mode", "playing")
  await page.keyboard.press("Space")
  await expect(scene).toHaveAttribute("data-mode", "paused")
})

test("ArrowRight plays one step then returns to paused at the next step", async ({ page }) => {
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  await scene.focus()
  await page.keyboard.press("ArrowRight")
  await expect(scene).toHaveAttribute("data-mode", "stepping")
  await expect(scene).toHaveAttribute("data-mode", "paused", { timeout: 10_000 })
  await expect(scene).toHaveAttribute("data-step-id", "pick")
})

test("dragging the slider to the end shows the last caption", async ({ page }) => {
  await gotoReady(page, path)
  const scrubber = page.getByTestId("scrubber")
  const thumb = scrubber.getByRole("slider")
  await scrubber.scrollIntoViewIfNeeded()
  const thumbBox = await thumb.boundingBox()
  const trackBox = await scrubber.boundingBox()
  if (thumbBox === null || trackBox === null) throw new Error("scrubber has no box")
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(trackBox.x + trackBox.width + 40, trackBox.y + trackBox.height / 2)
  await page.mouse.up()
  await expect(page.getByTestId("step-count")).toHaveText("Step 10 of 10")
  await expect(page.getByTestId("caption")).toHaveText("B is gone, and no user noticed. Sessions live in a shared store, so Server C can serve anyone.")
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "paused")
})

test("clicking the cue 'Server A misses 3 checks' sets data-step-id=fail", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  await page.getByTestId("prose").locator('[data-cue="fail"]').click()
  await expect(scene).toHaveAttribute("data-step-id", "fail")
  await expect(scene).toHaveAttribute("data-mode", "stepping")
  await expect(scene).toBeInViewport({ ratio: 0.9 })
})

test("deep link #/learn/load-balancer/step/scale opens at scale", async ({ page }) => {
  await gotoReady(page, `${path}/step/scale`)
  const scene = page.getByTestId("scene")
  await expect(scene).toHaveAttribute("data-step-id", "scale")
  await expect(scene).toHaveAttribute("data-mode", "paused")
  await expect(page.getByTestId("step-count")).toHaveText("Step 8 of 10")
})

test("with emulateMedia reducedMotion=reduce: data-motion=reduced, no packet elements during Play, and captions still advance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  await expect(scene).toHaveAttribute("data-motion", "reduced")
  await page.getByRole("button", { name: "Play" }).click()
  const maxPackets = await page.evaluate(() => new Promise<number>((resolve) => {
    let max = 0
    const started = performance.now()
    const sample = () => {
      max = Math.max(max, document.querySelectorAll("[data-scene-packet]").length)
      if (performance.now() - started < 3000) requestAnimationFrame(sample)
      else resolve(max)
    }
    requestAnimationFrame(sample)
  }))
  expect(maxPackets).toBe(0)
  await expect(scene).toHaveAttribute("data-step-id", "pick", { timeout: 6_000 })
})

test("frame budget: during 3 s of play, the 90th percentile rAF gap < 34 ms", async ({ page }) => {
  test.skip(!!process.env.CI, "the CI runner is not a target device, so the frame gate runs on a desktop only")
  await gotoReady(page, path)
  await page.getByRole("button", { name: "Play" }).click()
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "playing")
  const percentile = await page.evaluate(() => new Promise<number>((resolve) => {
    let last: number | undefined
    const gaps: number[] = []
    const started = performance.now()
    const loop = (now: number) => {
      if (last !== undefined) gaps.push(now - last)
      last = now
      if (now - started < 3000) requestAnimationFrame(loop)
      else {
        gaps.sort((a, b) => a - b)
        resolve(gaps[Math.floor(gaps.length * 0.9)] ?? 0)
      }
    }
    requestAnimationFrame(loop)
  }))
  expect(percentile).toBeLessThan(34)
})

test("ink is not regenerated during play", async ({ page }) => {
  await gotoReady(page, path)
  await page.locator('[data-scene-node="sessions"] svg[data-ink]').waitFor({ state: "attached" })
  const packet = page.getByTestId("scene").locator("[data-scene-packet]").first()
  await page.getByRole("button", { name: "Play" }).click()
  await expect(packet).toBeVisible()
  const records = await page.evaluate(() => new Promise<string[]>((resolve) => {
    const values: string[] = []
    const sample = () => {
      const svgs = document.querySelectorAll('[data-testid="stage"] svg[data-ink]')
      let total = 0
      svgs.forEach((svg) => { total += svg.innerHTML.length })
      values.push(`${svgs.length}:${total}`)
      if (values.length < 30) requestAnimationFrame(sample)
      else resolve(values)
    }
    requestAnimationFrame(sample)
  }))
  expect(new Set(records).size).toBe(1)
})
