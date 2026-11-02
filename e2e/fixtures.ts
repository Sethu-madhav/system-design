import { test as base, expect, type Page } from "@playwright/test"

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const consoleErrors: string[] = []

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text())
      }
    })
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message)
    })

    await use(consoleErrors)
  },
})

export { expect }

export async function gotoReady(page: Page, path: string) {
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}
