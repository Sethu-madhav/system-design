import { expect, type Page } from "@playwright/test"

export type QuizAnswer =
  | { readonly radio: string }
  | { readonly checks: readonly string[] }
  | { readonly order: "solved" }

export const CORRECT: readonly QuizAnswer[] = [
  { radio: "Stops routing to Server A and keeps using the others" },
  { radio: "Layer 7" },
  { radio: "Least connections" },
  { checks: ["Servers keep no per-user session in memory", "Sessions live in a shared store"] },
  { checks: ["Load can become uneven, because users stay on the server they started on", "Users on a server that dies lose their session"] },
  { radio: "Stop sending it new requests and let it finish the open ones" },
  { radio: "It fails or times out, unless the balancer retries it on another server" },
  { order: "solved" },
]

export const SYSTEM_DESIGN_CORRECT: readonly QuizAnswer[] = [
  { checks: ["Users can post a photo", "Users can follow other users"] },
  { radio: "Non-functional" },
  { radio: "Who uses it, and which actions must work, such as one-to-one or group chat?" },
  { radio: "About 2,300" },
  { radio: "Add a second copy of the database that can take over" },
  { radio: "Both can be good designs, because their requirements differ" },
  { radio: "A bank account balance" },
  { order: "solved" },
]

export const LATENCY_CORRECT: readonly QuizAnswer[] = [
  { radio: "Add an index so the feed query reads less data" },
  { radio: "1 in 100 feed loads takes 2 s or longer" },
  { radio: "The p99 latency" },
  { radio: "About 40%" },
  { radio: "It becomes many times longer than it is now" },
  { radio: "400" },
  { radio: "Limit the queue, and send a fast error when it is full" },
  { radio: "Analytics events that nobody waits on" },
]

export async function solveOrder(page: Page) {
  const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
    rows.map((row) => Number(row.getAttribute("data-item"))),
  )
  let values = await read()
  for (let target = 0; target < values.length; target += 1) {
    while (values.indexOf(target) > target) {
      const row = page.locator(`[data-testid="quiz-order"] li[data-item="${target}"]`)
      const upLabel = await row.getByRole("button").first().getAttribute("aria-label")
      await row.getByRole("button", { name: upLabel ?? "" }).click()
      values = await read()
    }
  }
  expect(values).toEqual([...values.keys()])
}

export async function answerQuiz(page: Page, answers: readonly QuizAnswer[] = CORRECT, { submit = true } = {}) {
  const quiz = page.getByTestId("quiz")
  for (const [index, answer] of answers.entries()) {
    if ("radio" in answer) await page.getByRole("radio", { name: answer.radio, exact: true }).click()
    if ("checks" in answer) {
      for (const name of answer.checks) await page.getByRole("checkbox", { name, exact: true }).check()
    }
    if ("order" in answer) await solveOrder(page)
    const last = submit && index === answers.length - 1
    await quiz.getByRole("button", { name: last ? "Submit" : "Next", exact: true }).click()
  }
}

export async function passQuiz(page: Page, answers: readonly QuizAnswer[] = CORRECT) {
  await answerQuiz(page, answers)
  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
}
