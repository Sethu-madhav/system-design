import { test, expect, gotoReady } from "./fixtures"

test("app works when served under /system-design/", async ({ page }) => {
  const failedResponses: string[] = []

  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`)
    }
  })

  await gotoReady(page, "http://localhost:4174/system-design/")
  await expect(page).toHaveTitle("Learn system design")
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Learn system design with lesson text, step-by-step hand-drawn diagrams and quizzes.",
  )
  await expect(page.getByRole("heading", { name: "Learn system design" })).toBeVisible()

  const iconHref = await page.locator('link[rel="icon"]').evaluate((icon) =>
    icon instanceof HTMLLinkElement ? icon.href : "",
  )
  expect(iconHref).toBe("http://localhost:4174/system-design/favicon.svg")
  const iconResponse = await page.request.get(iconHref)
  expect(iconResponse.status()).toBe(200)
  expect(iconResponse.headers()["content-type"]).toContain("svg")

  const assetNames = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name).filter((name) => name.includes("/assets/")),
  )
  expect(assetNames.length).toBeGreaterThan(0)
  expect(assetNames.every((name) => name.startsWith("http://localhost:4174/system-design/assets/"))).toBe(true)

  await page.getByRole("link", { name: "Load balancer" }).first().click()
  await expect(page).toHaveURL("http://localhost:4174/system-design/#/learn/load-balancer")
  await expect(page.getByTestId("scene")).toBeVisible()
  expect(failedResponses).toEqual([])
})
