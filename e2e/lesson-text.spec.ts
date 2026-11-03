import { expect, gotoReady, test } from "./fixtures"

test("home lists the Edge track with the Load balancer card", async ({ page }) => {
  await gotoReady(page, "/")
  const track = page.locator('[data-testid="track"][data-track="edge"]')
  await expect(track.getByRole("heading", { level: 2, name: "Edge and traffic" })).toBeVisible()
  const card = track.locator('[data-testid="lesson-card"][data-slug="load-balancer"]')
  await expect(card).toContainText("Load balancer")
  await expect(card).toContainText("9 min")
})

test("clicking the card opens #/learn/load-balancer", async ({ page }) => {
  await gotoReady(page, "/")
  await page.locator('[data-testid="lesson-card"][data-slug="load-balancer"]').click()
  await expect(page).toHaveURL(/#\/learn\/load-balancer$/)
  await expect(page.getByRole("heading", { level: 1, name: "Load balancer" })).toBeVisible()
})

test("lesson shows h2 'One server is not enough' and 10 cues", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  await expect(page.locator('[data-testid="prose"] h2[id="one-server-is-not-enough"]')).toHaveText("One server is not enough")
  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(10)
})

test("the lesson has no attribution section and lists the primer under further reading", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  await expect(page.getByTestId("attribution")).toHaveCount(0)
  await expect(page.getByRole("heading", { level: 2, name: "Attribution" })).toHaveCount(0)
  await expect(page.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(0)
  const reading = page.getByTestId("further-reading")
  await expect(reading.locator("a")).toHaveCount(4)
  await expect(reading.locator('a[href="https://github.com/donnemartin/system-design-primer#load-balancer"]')).toHaveText("The System Design Primer: load balancer")
})

test("deep link #/learn/load-balancer/adding-and-removing-servers scrolls the heading into view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await gotoReady(page, "/#/learn/load-balancer/adding-and-removing-servers")
  await expect(page.locator("#adding-and-removing-servers")).toBeInViewport()
  await expect(page.getByRole("heading", { level: 1, name: "Load balancer" })).not.toBeInViewport()
})

test("#/learn/no-such-lesson shows not found", async ({ page }) => {
  await gotoReady(page, "/#/learn/no-such-lesson")
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible()
  await expect(page.getByText("/learn/no-such-lesson")).toBeVisible()
})

test("sidebar link marks current lesson with aria-current", async ({ page }) => {
  await gotoReady(page, "/")
  const link = page.locator('[data-testid="sidebar"]').getByRole("link", { name: "Load balancer" })
  await expect(link).not.toHaveAttribute("aria-current")
  await link.click()
  await expect(link).toHaveAttribute("aria-current", "page")
})

test("every text line on a lesson card sits just above a ruled line", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await gotoReady(page, "/#/")
    const card = page.getByTestId("lesson-card").first().locator('[data-slot="index-card"]')
    const gaps = await card.evaluate((el) => {
      const rules = el.querySelector('[data-slot="paper-rules"]')
      if (rules === null) return []
      const [header, pitch] = getComputedStyle(rules).backgroundSize.split(",").map((layer) => Number.parseFloat(layer.trim().split(" ")[1] ?? ""))
      if (header === undefined || pitch === undefined) return []
      const top = rules.getBoundingClientRect().top
      const found: number[] = []
      for (const slot of ["index-card-title", "index-card-content", "index-card-footer"]) {
        const node = el.querySelector(`[data-slot="${slot}"]`)
        if (node === null) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const rect of range.getClientRects()) {
          const bottom = rect.bottom - top
          const rule = bottom < header ? Number.NEGATIVE_INFINITY : header + Math.floor((bottom - header) / pitch) * pitch
          found.push(bottom - rule)
        }
      }
      return found
    })
    expect(gaps.length, `${width} px has text lines`).toBeGreaterThanOrEqual(5)
    for (const gap of gaps) {
      expect(gap, `${width} px line gap ${gap}`).toBeGreaterThanOrEqual(2)
      expect(gap, `${width} px line gap ${gap}`).toBeLessThanOrEqual(9)
    }
  }
})

test("text links are blue and underlined", async ({ page }) => {
  const blue = "rgb(44, 79, 158)"
  const pages: [string, string][] = [
    ["/#/learn/load-balancer", '[data-testid="further-reading"] a, [data-testid="lesson-nav"] a, [data-testid="prose"] a'],
    ["/#/nowhere", '[data-testid="not-found"] a'],
  ]
  for (const [path, selector] of pages) {
    await gotoReady(page, path)
    const links = page.locator(selector)
    expect(await links.count(), `${path} has text links`).toBeGreaterThanOrEqual(1)
    for (const link of await links.all()) {
      await expect(link).toHaveCSS("color", blue)
      await expect(link).toHaveCSS("text-decoration-line", "underline")
    }
  }
})
