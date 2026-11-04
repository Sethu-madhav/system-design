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

test("deep link to 'fail' shows server A down", async ({ page }) => {
  await gotoReady(page, path)
  const scene = page.getByTestId("scene")
  const a = scene.locator('[data-scene-node="a"]')
  await expect(a).not.toHaveAttribute("data-down", "")
  await gotoReady(page, `${path}/step/fail`)
  await expect(scene).toHaveAttribute("data-step-id", "fail")
  await expect(scene).toHaveAttribute("data-mode", "paused")
  await expect(a).toHaveAttribute("data-down", "")
})

test("deep link to 'reroute' hides server C and 'scale' shows it", async ({ page }) => {
  await gotoReady(page, `${path}/step/reroute`)
  const scene = page.getByTestId("scene")
  const c = scene.locator('[data-scene-node="c"]')
  await expect(c).toHaveAttribute("data-visible", "false")
  await gotoReady(page, `${path}/step/scale`)
  await expect(c).toHaveAttribute("data-visible", "true")
})

test("caption text matches the step", async ({ page }) => {
  await gotoReady(page, path)
  await expect(page.getByTestId("step-count")).toHaveText("Step 1 of 10")
  await expect(page.getByTestId("caption")).toHaveText("Your request goes to the load balancer. You never see the servers behind it.")
  await gotoReady(page, `${path}/step/pick`)
  await expect(page.getByTestId("step-count")).toHaveText("Step 2 of 10")
  await expect(page.getByTestId("caption")).toHaveText("The balancer picks Server A by round robin and forwards the request.")
})

test("Prev returns to the previous caption", async ({ page }) => {
  await gotoReady(page, path)
  const prev = page.getByRole("button", { name: "Previous step" })
  await expect(prev).toBeDisabled()
  await gotoReady(page, `${path}/step/reply`)
  await prev.click()
  await expect(page.getByTestId("caption")).toHaveText("The balancer picks Server A by round robin and forwards the request.")
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "paused")
})

test("the cue for the current step has data-active", async ({ page }) => {
  await gotoReady(page, path)
  const prose = page.getByTestId("prose")
  await expect(prose.locator("[data-cue][data-active]")).toHaveCount(1)
  await expect(prose.locator('[data-cue="arrive"]')).toHaveAttribute("data-active", "")
  await gotoReady(page, `${path}/step/pick`)
  await expect(prose.locator('[data-cue="pick"]')).toHaveAttribute("data-active", "")
  await expect(prose.locator('[data-cue="arrive"]')).not.toHaveAttribute("data-active", "")
})

test("deep link to 'drain' keeps server B with a draining note and 'stateless' hides B and shows the session store", async ({ page }) => {
  const scene = page.getByTestId("scene")
  await gotoReady(page, `${path}/step/drain`)
  await expect(scene.locator('[data-scene-node="b"]')).toHaveAttribute("data-visible", "true")
  await gotoReady(page, `${path}/step/stateless`)
  await expect(scene.locator('[data-scene-node="b"]')).toHaveAttribute("data-visible", "false")
  await expect(scene.locator('[data-scene-node="sessions"]')).toHaveAttribute("data-visible", "true")
  await expect(scene.locator('[data-scene-node="a"]')).toHaveAttribute("data-down", "")
})

test("what-system-design-is shows 8 cues, 'dies' crosses out the database and 'bottleneck' brings it back", async ({ page }) => {
  const lesson = "/#/learn/what-system-design-is"
  await gotoReady(page, lesson)
  await expect(page.getByRole("heading", { level: 2, name: "A one-line idea is not a design" })).toBeVisible()
  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(8)
  const scene = page.getByTestId("scene")
  const db = scene.locator('[data-scene-node="db"]')
  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(3)
  await expect(page.getByText("Step 1 of 8")).toBeVisible()
  await gotoReady(page, `${lesson}/step/dies`)
  await expect(db).toHaveAttribute("data-down", "")
  await expect(db.getByTestId("scene-note")).toHaveText("what if this dies?")
  await gotoReady(page, `${lesson}/step/bottleneck`)
  await expect(db).not.toHaveAttribute("data-down", "")
  await expect(db.getByTestId("scene-note")).toHaveText("runs out first")
})

test("nodes carry their kind and role, and the database is filled with its role color", async ({ page }) => {
  await gotoReady(page, "/#/learn/what-system-design-is")
  const scene = page.getByTestId("scene")
  const phone = scene.locator('[data-scene-node="phone"]')
  const db = scene.locator('[data-scene-node="db"]')
  await expect(phone).toHaveAttribute("data-kind", "mobile")
  await expect(phone).toHaveAttribute("data-role", "outside")
  await expect(scene.locator('[data-scene-node="server"]')).toHaveAttribute("data-role", "compute")
  await expect(db).toHaveAttribute("data-role", "sql")
  await expect(db.locator('svg[data-ink] [data-layer="rest"] path[fill="var(--ll-sky)"]').first()).toBeAttached()
})

test("latency-and-throughput shows 9 cues, 'wait' notes the queue wait and 'shed' marks the queue full", async ({ page }) => {
  const lesson = "/#/learn/latency-and-throughput"
  await gotoReady(page, lesson)
  await expect(page.getByRole("heading", { level: 2, name: "Fast at noon, slow at night" })).toBeVisible()
  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(9)
  const scene = page.getByTestId("scene")
  const queue = scene.locator('[data-scene-node="queue"]')
  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(3)
  await expect(page.getByText("Step 1 of 9")).toBeVisible()
  await gotoReady(page, `${lesson}/step/wait`)
  await expect(queue.getByTestId("scene-note")).toHaveText("wait 90 ms")
  await gotoReady(page, `${lesson}/step/shed`)
  await expect(queue.getByTestId("scene-note")).toHaveText("full")
})

test("scaling-up-and-out shows 9 cues, 'lost' notes the missing session and 'db' marks the database busy", async ({ page }) => {
  const lesson = "/#/learn/scaling-up-and-out"
  await gotoReady(page, lesson)
  await expect(page.getByRole("heading", { level: 2, name: "Slow every evening" })).toBeVisible()
  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(9)
  const scene = page.getByTestId("scene")
  const three = scene.locator('[data-scene-node="three"]')
  const db = scene.locator('[data-scene-node="db"]')
  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(3)
  await expect(page.getByText("Step 1 of 9")).toBeVisible()
  await gotoReady(page, `${lesson}/step/lost`)
  await expect(three).toHaveAttribute("data-visible", "true")
  await expect(three.getByTestId("scene-note")).toHaveText("who is this?")
  await gotoReady(page, `${lesson}/step/db`)
  await expect(db.getByTestId("scene-note")).toHaveText("CPU 90%")
})
