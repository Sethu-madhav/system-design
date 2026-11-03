import { expect, type Page } from "@playwright/test"

export async function solveOrder(page: Page) {
  let values: number[] = []
  for (let target = 0; target < 4; target += 1) {
    values = await page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
      rows.map((row) => Number(row.getAttribute("data-item"))),
    )
    let position = values.indexOf(target)

    while (position > target) {
      const row = page.locator(`[data-testid="quiz-order"] li[data-item="${target}"]`)
      const upLabel = await row.getByRole("button").first().getAttribute("aria-label")
      await row.getByRole("button", { name: upLabel ?? "" }).click()
      values = await page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
        rows.map((item) => Number(item.getAttribute("data-item"))),
      )
      position = values.indexOf(target)
    }
  }
  expect(values).toEqual([0, 1, 2, 3])
}

export async function passQuiz(page: Page) {
  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("radio", { name: "Layer 7" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
  await page.getByRole("checkbox", { name: "Sessions live in a shared store" }).check()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await solveOrder(page)
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
}
