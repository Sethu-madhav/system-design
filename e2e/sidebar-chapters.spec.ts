import { expect, test, gotoReady } from "./fixtures"

test("sidebar chapter headings are numbered and larger than the lesson titles under them", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await gotoReady(page, "/#/learn/latency-and-throughput")
  const sidebar = page.getByTestId("sidebar")
  const labels = sidebar.locator('[data-sidebar="group-label"]')
  await expect(labels).toHaveText([/^1\.\s*Foundations$/, /^2\.\s*Edge and traffic$/])
  const size = (selector: string) =>
    sidebar.locator(selector).first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
  expect(await size('[data-sidebar="group-label"]')).toBeGreaterThan(await size('[data-sidebar="menu-button"]'))
})
