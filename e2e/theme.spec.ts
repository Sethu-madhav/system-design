import { expect, gotoReady, test } from "./fixtures"

const htmlClass = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.className)

test("the chosen theme persists across reload", async ({ page }) => {
  await gotoReady(page, "/#/")
  await page.getByTestId("theme-toggle").click()
  await page.getByRole("menuitemradio", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Theme: Dark. Change theme")
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark")

  await page.reload()
  await page.locator("#root > *").first().waitFor()
  await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Theme: Dark. Change theme")
})

test("html has the dark class at DOMContentLoaded, before React mounts", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark")
    document.addEventListener("DOMContentLoaded", () => {
      ;(window as unknown as { __atDcl: unknown }).__atDcl = {
        className: document.documentElement.className,
        rootChildren: document.getElementById("root")?.childElementCount ?? -1,
      }
    })
  })
  await gotoReady(page, "/#/")
  const atDcl = await page.evaluate(() => (window as unknown as { __atDcl: unknown }).__atDcl)
  expect(atDcl).toEqual({ className: "dark", rootChildren: 0 })
  const meta = await page.locator('meta[name="theme-color"]').getAttribute("content")
  expect(meta).toBe("#0f1115")
})

test("an invalid stored value falls back to the system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.addInitScript(() => localStorage.setItem("theme", "purple"))
  await gotoReady(page, "/#/")
  expect(await htmlClass(page)).toBe("dark")
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Theme: System. Change theme")
})

test("system mode follows the OS color scheme live", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await gotoReady(page, "/#/")
  await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName("Theme: System. Change theme")
  await expect(page.locator("html")).toHaveClass(/\blight\b/)

  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  await expect(page.locator("html")).not.toHaveClass(/\blight\b/)

  await page.emulateMedia({ colorScheme: "light" })
  await expect(page.locator("html")).toHaveClass(/\blight\b/)
})

test("a fixed choice ignores OS changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.addInitScript(() => localStorage.setItem("theme", "light"))
  await gotoReady(page, "/#/")
  await expect(page.locator("html")).toHaveClass(/\blight\b/)
  await page.emulateMedia({ colorScheme: "light" })
  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/\blight\b/)
})

test("the toggle works with the keyboard alone", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await gotoReady(page, "/#/")
  const toggle = page.getByTestId("theme-toggle")
  await toggle.focus()

  await page.keyboard.press("Enter")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(page.getByRole("menuitemradio", { name: "System" })).toHaveAttribute("aria-checked", "true")

  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(toggle).toBeFocused()

  await page.keyboard.press("Space")
  await expect(menu).toBeVisible()
  await expect(page.getByRole("menuitemradio", { name: "Light" })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(menu).toBeHidden()
  await expect(toggle).toBeFocused()
  await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  await expect(toggle).toHaveAccessibleName("Theme: Dark. Change theme")
})
