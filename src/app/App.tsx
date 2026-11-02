import { InkProvider } from "@/lib/ink/react"
import { HomePage } from "@/app/HomePage"
import { NotFoundPage } from "@/app/NotFoundPage"
import { Shell } from "@/app/Shell"
import { href, useRoute, type Route } from "@/app/routes"

function assertNever(route: never): never {
  throw new Error(`Unhandled route: ${String(route)}`)
}

function renderPage(route: Route) {
  switch (route.name) {
    case "home":
      return <HomePage />
    case "lesson":
      return <NotFoundPage path={href(route).slice(1)} />
    case "not-found":
      return <NotFoundPage path={route.path} />
    default:
      return assertNever(route)
  }
}

export function App() {
  const route = useRoute()

  return (
    <InkProvider>
      <Shell>{renderPage(route)}</Shell>
    </InkProvider>
  )
}
