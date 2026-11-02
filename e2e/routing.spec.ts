import { expect, gotoReady, test } from "./fixtures"

test("home renders heading", async ({ page }) => {
  await gotoReady(page, "/")
  await expect(page.getByRole("heading", { level: 1, name: "Learn system design" })).toBeVisible()
})

test("unknown hash shows not found and a link home that works", async ({ page }) => {
  await gotoReady(page, "/#/nowhere")
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible()
  await expect(page.getByText("/nowhere")).toBeVisible()
  await page.getByRole("link", { name: "Back to home" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Learn system design" })).toBeVisible()
  await expect.poll(() => page.url()).toMatch(/#\/$/)
})

test("browser back returns to the previous route", async ({ page }) => {
  await gotoReady(page, "/#/nowhere")
  await page.getByRole("link", { name: "Back to home" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Learn system design" })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible()
})
