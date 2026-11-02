import { expect, gotoReady, test } from "./fixtures"

test("app boots and renders a root element", async ({ page, consoleErrors }) => {
  await gotoReady(page, "/")
  await expect.poll(() => page.locator("#root > *").count()).toBeGreaterThan(0)
  expect(consoleErrors).toEqual([])
})
