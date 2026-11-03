import { expect, gotoReady, test } from "./fixtures"

test("home lists the Edge track with the Load balancer card", async ({ page }) => {
  await gotoReady(page, "/")
  const track = page.locator('[data-testid="track"][data-track="edge"]')
  await expect(track.getByRole("heading", { level: 2, name: "Edge and traffic" })).toBeVisible()
  const card = track.locator('[data-testid="lesson-card"][data-slug="load-balancer"]')
  await expect(card).toContainText("Load balancer")
  await expect(card).toContainText("2 min")
})

test("clicking the card opens #/learn/load-balancer", async ({ page }) => {
  await gotoReady(page, "/")
  await page.locator('[data-testid="lesson-card"][data-slug="load-balancer"]').click()
  await expect(page).toHaveURL(/#\/learn\/load-balancer$/)
  await expect(page.getByRole("heading", { level: 1, name: "Load balancer" })).toBeVisible()
})

test("lesson shows h2 'What it does' and 8 cues", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  await expect(page.locator('[data-testid="prose"] h2[id="what-it-does"]')).toHaveText("What it does")
  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(8)
})

test("attribution links to the primer anchor and to the CC BY 4.0 license and says text was changed", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  const attribution = page.locator('[data-testid="attribution"]')
  await expect(attribution.locator('a[href="https://github.com/donnemartin/system-design-primer#load-balancer"]')).toBeVisible()
  await expect(attribution.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toBeVisible()
  await expect(attribution).toContainText("Text paraphrased and shortened. Diagrams are original.")
})

test("deep link #/learn/load-balancer/horizontal-scaling scrolls the heading into view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await gotoReady(page, "/#/learn/load-balancer/horizontal-scaling")
  await expect(page.locator("#horizontal-scaling")).toBeInViewport()
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
