import { useEffect, useMemo, useState } from "react"
import { href } from "@/app/routes"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { curriculum } from "@/content"
import { buildIndex, search } from "@/search"
import type { DocKind, SearchDoc, SearchIndex } from "@/search"

let cached: SearchIndex | undefined

function lessonIndex(): SearchIndex {
  cached ??= buildIndex(curriculum.flat)
  return cached
}

const GROUPS: readonly { readonly kind: DocKind; readonly heading: string }[] = [
  { kind: "lesson", heading: "Lessons" },
  { kind: "section", heading: "Sections" },
  { kind: "step", heading: "Diagram steps" },
]

function target(doc: SearchDoc): string {
  switch (doc.kind) {
    case "lesson":
      return href({ name: "lesson", slug: doc.slug })
    case "section":
      return href({ name: "lesson", slug: doc.slug, section: doc.anchor })
    case "step":
      return href({ name: "lesson", slug: doc.slug, step: doc.anchor })
  }
}

export function SearchPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setQuery("")
  }
  const hits = useMemo(() => (open ? search(lessonIndex(), query) : []), [open, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
        setQuery("")
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const targetElement = event.target
        const editable = targetElement instanceof HTMLElement && (
          targetElement.isContentEditable || targetElement.closest("input, textarea, select") !== null
        )
        if (!editable) {
          event.preventDefault()
          setOpen(true)
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <Button variant="outline" size="sm" data-testid="search-open" onClick={() => setOpen(true)}>
        Search <Kbd>⌘K</Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Search lessons"
        description="Find a lesson, a section or a diagram step."
        commandProps={{ shouldFilter: false, className: "min-w-0" }}
      >
        <CommandInput data-testid="search-input" placeholder="Search lessons, sections and steps" value={query} onValueChange={setQuery} />
        <CommandList data-testid="search-results">
          {query.trim() === "" ? (
            <p data-testid="search-hint" className="px-2 py-3 font-hand text-base text-pencil-text">
              Type to find a lesson, a section or a diagram step.
            </p>
          ) : (
            <>
              {GROUPS.map(({ kind, heading }) => {
                const groupHits = hits.filter((hit) => hit.doc.kind === kind)
                if (groupHits.length === 0) return null
                return (
                  <CommandGroup key={kind} heading={heading}>
                    {groupHits.map((hit) => {
                      const t = target(hit.doc)
                      return (
                        <CommandItem key={t} value={t} data-testid="search-result" data-kind={hit.doc.kind} data-href={t} onSelect={() => {
                          window.location.hash = t
                          onOpenChange(false)
                        }}>
                          <div data-testid="search-result-content" className="min-w-0 flex-1">
                            <span className="font-bold">{hit.doc.title}</span>
                            {hit.doc.kind !== "lesson" && <span className="text-pencil-text"> · {hit.doc.lessonTitle}</span>}
                            <span className="block truncate text-sm text-pencil-text">
                              {hit.snippet.before}<strong className="text-ink">{hit.snippet.match}</strong>{hit.snippet.after}
                            </span>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              })}
              {hits.length === 0 && <CommandEmpty>No matches.</CommandEmpty>}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
