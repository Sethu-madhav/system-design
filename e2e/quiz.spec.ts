import { expect, gotoReady, test } from "./fixtures"
import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"

const path = "/#/learn/load-balancer"

test("answering all correctly shows 8/8 and passed", async ({ page }) => {
  await gotoReady(page, path)
  await answerQuiz(page)

  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveText("Passed")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
  await expect(page.getByTestId("quiz-answer")).toHaveCount(8)
  expect(await page.getByTestId("quiz-answer").evaluateAll((items) =>
    items.every((item) => item.getAttribute("data-correct") === "true"),
  )).toBe(true)
})

test("the what-system-design-is answer key scores 8/8", async ({ page }) => {
  await gotoReady(page, "/#/learn/what-system-design-is")
  await answerQuiz(page, SYSTEM_DESIGN_CORRECT)

  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
})

test("the latency-and-throughput answer key scores 8/8", async ({ page }) => {
  await gotoReady(page, "/#/learn/latency-and-throughput")
  await answerQuiz(page, LATENCY_CORRECT)

  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
})

test("the scaling-up-and-out answer key scores 8/8", async ({ page }) => {
  await gotoReady(page, "/#/learn/scaling-up-and-out")
  await answerQuiz(page, SCALING_CORRECT)

  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
})

test("the availability answer key scores 8/8", async ({ page }) => {
  await gotoReady(page, "/#/learn/availability")
  await answerQuiz(page, AVAILABILITY_CORRECT)

  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
})

test("the consistency answer key scores 8/8", async ({ page }) => {
  await gotoReady(page, "/#/learn/consistency-and-partitions")
  await answerQuiz(page, CONSISTENCY_CORRECT)

  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
})

test("a wrong choice shows its why", async ({ page }) => {
  await gotoReady(page, path)
  await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])

  await expect(page.getByTestId("quiz-score")).toHaveText("7/8")
  const firstAnswer = page.locator('[data-testid="quiz-answer"][data-index="0"]')
  await expect(firstAnswer).toHaveAttribute("data-correct", "false")
  await expect(firstAnswer).toContainText("Restarting is an orchestrator's job, not the balancer's.")
})

test("3 wrong answers out of 8 fails the quiz", async ({ page }) => {
  await gotoReady(page, path)
  await answerQuiz(page, [
    { radio: "Restarts Server A" },
    { radio: "Layer 4" },
    { radio: "Round robin" },
    ...CORRECT.slice(3),
  ])

  await expect(page.getByTestId("quiz-score")).toHaveText("5/8")
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "false")
})

test("'show me' on the drain question sets the scene to step drain", async ({ page }) => {
  await gotoReady(page, path)
  await answerQuiz(page, [
    ...CORRECT.slice(0, 5),
    { radio: "Shut it down and let health checks reroute traffic" },
    ...CORRECT.slice(6),
  ])
  const drainAnswer = page.locator('[data-testid="quiz-answer"][data-index="5"]')
  await expect(drainAnswer).toContainText("Requests in flight on B fail")
  await drainAnswer.getByRole("button", { name: "Show me in the diagram" }).click()

  const scene = page.getByTestId("scene")
  await expect(scene).toHaveAttribute("data-step-id", "drain")
  await expect(scene).toHaveAttribute("data-mode", "stepping")
  await expect(scene).toBeInViewport()
})

test("Retake clears answers", async ({ page }) => {
  await gotoReady(page, path)
  await answerQuiz(page)
  await page.getByRole("button", { name: "Retake" }).click()

  await expect(page.getByTestId("quiz")).toHaveAttribute("data-phase", "answering")
  await expect(page.getByTestId("quiz-count")).toHaveText("Question 1 of 8")
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
  await next.click()
  await page.getByRole("radio", { name: "Least connections" }).click()
  await next.click()

  const multiOption = page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" })
  await expect(next).toBeDisabled()
  await multiOption.check()
  await expect(next).toBeEnabled()
  await multiOption.uncheck()
  await expect(next).toBeDisabled()
  await multiOption.check()
  await next.click()
  await answerQuiz(page, CORRECT.slice(4, 7), { submit: false })
  await expect(page.getByTestId("quiz-count")).toHaveText("Question 8 of 8")
  await expect(page.getByTestId("quiz").getByRole("button", { name: "Submit" })).toBeEnabled()
})
