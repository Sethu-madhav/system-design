import AxeBuilder from "@axe-core/playwright"
import { expect, gotoReady, test } from "./fixtures"

for (const theme of ["light", "dark"] as const) {
  test(`axe finds no serious violations on home and lesson in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme)
    const violations: string[] = []
    for (const size of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      for (const path of ["/#/", "/#/learn/load-balancer"]) {
        await page.setViewportSize(size)
        await gotoReady(page, path)
        await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
        for (const violation of results.violations) {
          if (violation.impact === "serious" || violation.impact === "critical") {
            violations.push(`${theme} ${size.width}x${size.height} ${path} ${violation.id}`)
          }
        }
      }
    }
    expect(violations).toEqual([])
  })
}

test("at 390x844 the sidebar opens from a menu button and the stage fits without horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await gotoReady(page, "/#/learn/load-balancer")
  await expect(page.getByTestId("sidebar")).toBeHidden()
  await expect(page.getByTestId("toc")).toBeHidden()
  const dimensions = await page.evaluate(() => {
    const scene = document.querySelector('[data-testid="scene"]')
    const rect = scene?.getBoundingClientRect()
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      x: rect?.x,
      right: rect === undefined ? undefined : rect.x + rect.width,
    }
  })
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(dimensions.x).toBeGreaterThanOrEqual(0)
  expect(dimensions.right).toBeLessThanOrEqual(390)
  await expect(page.getByRole("region", { name: "Diagram, scrolls sideways" })).toBeVisible()
  const punctuation = await page.evaluate(() => {
    const failures: string[] = []
    let checked = 0
    for (const cue of document.querySelectorAll<HTMLElement>("[data-cue]")) {
      const sibling = cue.nextSibling
      if (sibling?.nodeType !== Node.TEXT_NODE || !sibling.textContent || !/^[.,;:!?)]/.test(sibling.textContent)) continue
      const punct = sibling.textContent.match(/^[.,;:!?)]+/)?.[0]
      if (punct === undefined) continue
      checked += 1
      const range = document.createRange()
      range.setStart(sibling, 0)
      range.setEnd(sibling, 1)
      const rect = range.getBoundingClientRect()
      const cueRects = cue.getClientRects()
      const last = cueRects.item(cueRects.length - 1)
      if (last === null || rect.top < last.top - 1 || rect.bottom > last.bottom + 1 || Math.abs(rect.left - last.right) > 2) {
        failures.push(cue.dataset.cue ?? "unknown")
      }
    }
    return { failures, checked }
  })
  expect(punctuation.failures).toEqual([])
  expect(punctuation.checked).toBeGreaterThanOrEqual(6)
  await page.getByTestId("menu-open").click()
  await expect(page.getByTestId("sidebar-sheet")).toBeVisible()
  await page.getByTestId("sidebar-sheet").getByRole("link", { name: "Load balancer" }).click()
  await expect(page.getByTestId("sidebar-sheet")).toBeHidden()
  await expect(page).toHaveURL(/#\/learn\/load-balancer$/)
})

test("TOC link scrolls to the section", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  await expect(page.getByTestId("menu-open")).toBeHidden()
  const breadcrumb = page.getByTestId("breadcrumb")
  await expect(breadcrumb.getByRole("link", { name: "Home" })).toHaveAttribute("href", "#/")
  await expect(breadcrumb).toContainText("Edge and traffic")
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Load balancer")
  const toc = page.getByTestId("toc")
  await expect(toc).toBeVisible()
  await expect(toc.locator("a").allTextContents()).resolves.toEqual([
    "One server is not enough",
    "What happens to one request",
    "Health checks",
    "Choosing a server",
    "Layer 4 and layer 7",
    "Adding and removing servers",
    "Sessions and sticky routing",
    "When the balancer fails",
    "How Dropbox balances its requests",
    "In a design review",
  ])
  await toc.getByRole("link", { name: "Choosing a server" }).click()
  await expect(page).toHaveURL(/#\/learn\/load-balancer\/choosing-a-server$/)
  await expect(page.locator("#choosing-a-server")).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const tocRect = await toc.boundingBox()
  expect(tocRect?.y).toBeGreaterThanOrEqual(0)
  expect(tocRect?.y).toBeLessThan(720)
})

test("every player control reachable by Tab with a visible focus ring", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer/step/pick")
  const region = page.getByRole("region", { name: "Diagram, scrolls sideways" })
  await expect(region).toHaveCount(0)
  const first = page.getByRole("button", { name: "First step" })
  const beforeFocus = await first.locator('[data-layer="focus"]').evaluateAll((layers) => layers.some((layer) => getComputedStyle(layer).visibility === "visible"))
  expect(beforeFocus).toBe(false)
  await page.getByTestId("scene").focus()
  const controls = [
    page.getByRole("button", { name: "First step" }),
    page.getByRole("button", { name: "Previous step" }),
    page.getByRole("button", { name: "Play", exact: true }),
    page.getByRole("button", { name: "Next step" }),
    page.getByRole("button", { name: "Last step" }),
    page.getByRole("slider", { name: "Scrub through the diagram" }),
  ]
  for (const control of controls) {
    await page.keyboard.press("Tab")
    const focused = await control.evaluate((el) => {
      const layer = el.querySelector('[data-layer="focus"]')
      const style = layer === null ? null : getComputedStyle(layer)
      return {
        active: el === document.activeElement,
        visibleFocus: el.matches(":focus-visible"),
        layerVisible: style?.visibility === "visible" && style.opacity === "1",
      }
    })
    expect(focused).toEqual({ active: true, visibleFocus: true, layerVisible: true })
  }
  const caption = page.getByTestId("caption")
  const oldCaption = await caption.textContent()
  await expect(page.getByRole("img", { name: oldCaption ?? "", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Next step" }).click()
  await expect(caption).not.toHaveText(oldCaption ?? "")
  const newCaption = await caption.textContent()
  await expect(page.getByRole("img", { name: newCaption ?? "", exact: true })).toBeVisible()
  const failCue = page.locator('[data-cue="fail"]')
  await failCue.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByTestId("scene")).toHaveAttribute("data-step-id", "fail")
  const arriveCue = page.locator('[data-cue="arrive"]')
  await arriveCue.focus()
  await page.keyboard.press("Space")
  await expect(page.getByTestId("scene")).toHaveAttribute("data-step-id", "arrive")
})

test("TOC links turn blue on hover and show a focus outline", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  const links = page.getByTestId("toc").locator("a")
  const first = links.nth(0)
  const second = links.nth(1)
  await expect(second).toHaveCSS("text-decoration-line", "none")
  await expect(second).not.toHaveCSS("color", "rgb(44, 79, 158)")
  await second.hover()
  await expect(second).toHaveCSS("color", "rgb(44, 79, 158)")
  await expect(second).toHaveCSS("text-decoration-line", "underline")
  await page.mouse.move(0, 0)
  await expect(second).toHaveCSS("text-decoration-line", "none")
  await first.focus()
  await page.keyboard.press("Tab")
  await expect(second).toBeFocused()
  await expect(second).toHaveCSS("outline-style", "solid")
  await expect(second).toHaveCSS("outline-width", "2px")
})
