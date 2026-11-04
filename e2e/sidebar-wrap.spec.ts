import { expect, test, gotoReady } from "./fixtures"

test("a sidebar title that wraps to two lines stays above its row's rule", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await gotoReady(page, "/#/learn/latency-and-throughput")
  const rows = page.getByTestId("sidebar").locator('[data-sidebar="menu-button"]')
  await expect(rows.first()).toBeVisible()
  const boxes = await rows.evaluateAll((els) =>
    els.map((el) => {
      const range = document.createRange()
      range.selectNodeContents(el.firstChild ?? el)
      const lines = range.getClientRects().length
      return { lines, text: range.getBoundingClientRect().bottom, row: el.getBoundingClientRect().bottom }
    }),
  )
  expect(boxes.some((box) => box.lines > 1)).toBe(true)
  for (const box of boxes) expect(box.text).toBeLessThanOrEqual(box.row)
})
