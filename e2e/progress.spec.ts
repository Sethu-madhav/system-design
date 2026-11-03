import { expect, gotoReady, test } from "./fixtures"
import { passQuiz } from "./helpers"

const lessonPath = "/#/learn/load-balancer"
const lessonMark = (page: import("@playwright/test").Page) =>
  page.getByTestId("sidebar").locator('[data-testid="lesson-status"][data-slug="load-balancer"]')

test("pass the quiz, reload, the sidebar shows a check for Load balancer", async ({ page }) => {
  await gotoReady(page, lessonPath)
  await expect(lessonMark(page)).toHaveAttribute("data-status", "started")
  await passQuiz(page)
  await expect(lessonMark(page)).toHaveAttribute("data-status", "done")
  await gotoReady(page, lessonPath)
  await expect(lessonMark(page)).toHaveAttribute("data-status", "done")
})

test("home Continue card points at the first not-done lesson", async ({ page }) => {
  await gotoReady(page, "/#/")
  await expect(page.getByTestId("progress-count")).toHaveText("0 of 1 lessons done")
  const next = page.getByTestId("next-lesson")
  await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
  await expect(next).toHaveAttribute("data-status", "new")
  await expect(next).toContainText("Start here")
  await gotoReady(page, lessonPath)
  await gotoReady(page, "/#/")
  await expect(next).toHaveAttribute("data-status", "started")
  await expect(next).toContainText("Continue")
  await gotoReady(page, lessonPath)
  await passQuiz(page)
  await gotoReady(page, "/#/")
  await expect(page.getByTestId("next-lesson")).toHaveCount(0)
  await expect(page.getByTestId("all-done")).toBeVisible()
  await expect(page.getByTestId("progress-count")).toHaveText("1 of 1 lessons done")
})

test("Reset progress clears marks", async ({ page }) => {
  await gotoReady(page, lessonPath)
  await passQuiz(page)
  await gotoReady(page, "/#/")
  await page.getByRole("button", { name: "Reset progress" }).click()
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(lessonMark(page)).toHaveAttribute("data-status", "done")
  await page.getByRole("button", { name: "Reset progress" }).click()
  await page.getByRole("button", { name: "Reset", exact: true }).click()
  await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
  await expect(page.getByTestId("progress-count")).toHaveText("0 of 1 lessons done")
  expect(await page.evaluate(() => localStorage.getItem("sd.progress"))).toBe(null)
  await gotoReady(page, "/#/")
  await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
})

test("corrupt localStorage value does not crash the app", async ({ page }) => {
  await gotoReady(page, "/#/")
  await page.evaluate(() => localStorage.setItem("sd.progress", "{not json"))
  await gotoReady(page, "/#/")
  await expect(page.getByTestId("page")).toBeVisible()
  await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
  await expect(page.getByTestId("next-lesson")).toHaveAttribute("data-status", "new")
  await gotoReady(page, lessonPath)
  await expect(lessonMark(page)).toHaveAttribute("data-status", "started")
  const raw = await page.evaluate(() => localStorage.getItem("sd.progress"))
  expect(raw).not.toBe(null)
  expect(JSON.parse(raw ?? "null")).toMatchObject({ v: 1 })
})

test("reaching the last diagram step records scene-done", async ({ page }) => {
  await gotoReady(page, lessonPath)
  await page.getByRole("button", { name: "Last step" }).click()
  await expect.poll(async () => {
    const raw = await page.evaluate(() => localStorage.getItem("sd.progress"))
    return raw === null ? undefined : JSON.parse(raw).lessons["load-balancer"]?.sceneDoneAt
  }).toEqual(expect.any(Number))
  await expect(lessonMark(page)).toHaveAttribute("data-status", "started")
})
