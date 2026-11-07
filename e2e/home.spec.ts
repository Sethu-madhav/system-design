import { expect, gotoReady, test } from "./fixtures"

test("home explains the course", async ({ page }) => {
  await gotoReady(page, "/")
  await expect(page.getByRole("heading", { level: 1, name: "Learn system design" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "How a lesson works" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "Who it is for" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "The lessons" })).toBeVisible()
  const howItWorks = page.getByTestId("how-it-works")
  await expect(howItWorks.getByText("Read", { exact: true })).toBeVisible()
  await expect(howItWorks.getByText("Watch", { exact: true })).toBeVisible()
  await expect(howItWorks.getByText("Check", { exact: true })).toBeVisible()
  await expect(page.getByTestId("audience").locator("ol > li")).toHaveCount(4)
  await expect(page.getByRole("button", { name: "Reset progress" })).toBeVisible()
})
