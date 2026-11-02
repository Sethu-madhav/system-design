import { href } from "@/app/routes"

export function NotFoundPage({ path }: { path: string }) {
  return (
    <div className="space-y-4">
      <h1 className="font-script text-4xl font-bold text-ink">Page not found</h1>
      <p className="font-hand text-lg text-pencil-text">
        There is nothing at <code className="break-all text-ink">{path}</code>.
      </p>
      <a href={href({ name: "home" })} className="font-hand text-lg text-link underline">
        Back to home
      </a>
    </div>
  )
}
