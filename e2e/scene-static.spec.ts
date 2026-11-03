import { expect, test, gotoReady } from "./fixtures"

const path = "/#/learn/load-balancer"

test("stage shows 4 visible nodes at step 1 (c and sessions hidden)", async ({ page }) => {
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(4)
  await expect(scene.locator('[data-scene-node="c"]')).toHaveAttribute("data-visible", "false")
  await expect(scene.locator('[data-scene-node="sessions"]')).toHaveAttribute("data-visible", "false")
  await expect(scene.locator('[data-scene-node="you"] svg[data-ink] [data-layer="rest"] path').first()).toBeVisible()
})

test("Next four times reaches 'fail' and server A has data-down", async ({ page }) => {
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  const a = scene.locator('[data-scene-node="a"]')
  await expect(a).not.toHaveAttribute("data-down", "")
  for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Next step" }).click()
  await expect(scene).toHaveAttribute("data-step-id", "fail")
  await expect(a).toHaveAttribute("data-down", "")
})

test("Next at 'scale' makes server C visible", async ({ page }) => {
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  const c = scene.locator('[data-scene-node="c"]')
  for (let i = 0; i < 5; i += 1) await page.getByRole("button", { name: "Next step" }).click()
  await expect(scene).toHaveAttribute("data-step-id", "reroute")
  await expect(c).toHaveAttribute("data-visible", "false")
  await page.getByRole("button", { name: "Next step" }).click()
  await expect(scene).toHaveAttribute("data-step-id", "scale")
  await expect(c).toHaveAttribute("data-visible", "true")
})

test("caption text matches the step", async ({ page }) => {
  await gotoReady(page, path)
  await expect(page.getByTestId("step-count")).toHaveText("Step 1 of 8")
  await expect(page.getByTestId("caption")).toHaveText("Your request goes to the load balancer, not to a server.")
  await page.getByRole("button", { name: "Next step" }).click()
  await expect(page.getByTestId("step-count")).toHaveText("Step 2 of 8")
  await expect(page.getByTestId("caption")).toHaveText("The balancer picks a healthy server, here by round robin, and forwards the request.")
})

test("Prev returns to the previous caption", async ({ page }) => {
  await gotoReady(page, path)
  const prev = page.getByRole("button", { name: "Previous step" })
  await expect(prev).toBeDisabled()
  await page.getByRole("button", { name: "Next step" }).click()
  await page.getByRole("button", { name: "Next step" }).click()
  await prev.click()
  await expect(page.getByTestId("caption")).toHaveText("The balancer picks a healthy server, here by round robin, and forwards the request.")
})

test("the cue for the current step has data-active", async ({ page }) => {
  await gotoReady(page, path)
  const prose = page.getByTestId("prose")
  await expect(prose.locator("[data-cue][data-active]")).toHaveCount(1)
  await expect(prose.locator('[data-cue="arrive"]')).toHaveAttribute("data-active", "")
  await page.getByRole("button", { name: "Next step" }).click()
  await expect(prose.locator('[data-cue="pick"]')).toHaveAttribute("data-active", "")
  await expect(prose.locator('[data-cue="arrive"]')).not.toHaveAttribute("data-active", "")
})
