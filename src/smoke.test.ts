import { expect, test } from "vitest"
import { cn } from "@/lib/utils"

test("vitest runs and resolves the @ alias", () => {
  expect(cn("a", false && "b", "c")).toBe("a c")
})
