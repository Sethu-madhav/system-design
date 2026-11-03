import { expect, gotoReady, test } from "./fixtures"
import { solveOrder } from "./helpers"

const path = "/#/learn/load-balancer"

test("answering all correctly shows 4/4 and passed", async ({ page }) => {
  await gotoReady(page, path)
  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("radio", { name: "Layer 7" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
  await page.getByRole("checkbox", { name: "Sessions live in a shared store" }).check()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await solveOrder(page)
  await page.getByRole("button", { name: "Submit" }).click()

  await expect(page.getByTestId("quiz-score")).toHaveText("4/4")
  await expect(page.getByTestId("quiz-verdict")).toHaveText("Passed")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
  await expect(page.getByTestId("quiz-answer")).toHaveCount(4)
  expect(await page.getByTestId("quiz-answer").evaluateAll((items) =>
    items.every((item) => item.getAttribute("data-correct") === "true"),
  )).toBe(true)
})

test("a wrong choice shows its why", async ({ page }) => {
  await gotoReady(page, path)
  await page.getByRole("radio", { name: "Restarts Server A" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("radio", { name: "Layer 7" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await solveOrder(page)
  await page.getByRole("button", { name: "Submit" }).click()

  const firstAnswer = page.locator('[data-testid="quiz-answer"][data-index="0"]')
  await expect(firstAnswer).toHaveAttribute("data-correct", "false")
  await expect(firstAnswer).toContainText("Restarting is an orchestrator's job, not the balancer's.")
})

test("'show me' on the health-check question sets the scene to step fail", async ({ page }) => {
  await gotoReady(page, path)
  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("radio", { name: "Layer 7" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await solveOrder(page)
  await page.getByRole("button", { name: "Submit" }).click()
  await page.locator('[data-testid="quiz-answer"][data-index="0"]').getByRole("button", { name: "Show me in the diagram" }).click()

  const scene = page.getByTestId("scene")
  await expect(scene).toHaveAttribute("data-step-id", "fail")
  await expect(scene).toHaveAttribute("data-mode", "stepping")
  await expect(scene).toBeInViewport()
})

test("Retake clears answers", async ({ page }) => {
  await gotoReady(page, path)
  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("radio", { name: "Layer 7" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await solveOrder(page)
  await page.getByRole("button", { name: "Submit" }).click()
  await page.getByRole("button", { name: "Retake" }).click()

  await expect(page.getByTestId("quiz")).toHaveAttribute("data-phase", "answering")
  await expect(page.getByTestId("quiz-count")).toHaveText("Question 1 of 4")
  expect(await page.getByRole("radio").evaluateAll((radios) =>
    radios.every((radio) => radio.getAttribute("aria-checked") !== "true"),
  )).toBe(true)
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled()
})

test("Next and Submit are disabled until the question is answered", async ({ page }) => {
  await gotoReady(page, path)
  const next = page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true })
  await expect(next).toBeDisabled()
  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
  await expect(next).toBeEnabled()
  await next.click()
  await page.getByRole("radio", { name: "Layer 7" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()

  const multiNext = page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true })
  const multiOption = page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" })
  await expect(multiNext).toBeDisabled()
  await multiOption.check()
  await expect(multiNext).toBeEnabled()
  await multiOption.uncheck()
  await expect(multiNext).toBeDisabled()
  await multiOption.check()
  await multiNext.click()
  await expect(page.getByTestId("quiz").getByRole("button", { name: "Submit" })).toBeEnabled()
})
