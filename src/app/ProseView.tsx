import { Blockquote, H2, H3, InlineCode, List, P } from "@/components/ui/typography"
import { Highlight } from "@/components/ui/highlight"
import { useSceneCue } from "@/scene"
import type { Block, Inline, Prose } from "@/content"
import type { KeyboardEvent, ReactNode } from "react"

function Cue({ step, text }: { step: string; text: string }) {
  const { active, play } = useSceneCue(step)
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    play()
  }
  return (
    <span role="button" tabIndex={0} data-cue={step} data-active={active ? "" : undefined} onClick={play} onKeyDown={onKeyDown} className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ink">
      <Highlight seed={step}>{text}</Highlight>
    </span>
  )
}

function renderInline(node: Inline, index: number): ReactNode {
  switch (node.t) {
    case "text":
      return node.v
    case "strong":
      return <strong key={index}>{node.c.map(renderInline)}</strong>
    case "em":
      return <em key={index}>{node.c.map(renderInline)}</em>
    case "code":
      return <InlineCode key={index}>{node.v}</InlineCode>
    case "link":
      return <a key={index} href={node.href}>{node.c.map(renderInline)}</a>
    case "cue":
      return <Cue key={index} step={node.step} text={node.text} />
  }
}

function renderBlock(block: Block, index: number) {
  switch (block.t) {
    case "h":
      return block.level === 2
        ? <H2 key={index} id={block.id}>{block.c.map(renderInline)}</H2>
        : <H3 key={index} id={block.id}>{block.c.map(renderInline)}</H3>
    case "p":
      return <P key={index}>{block.c.map(renderInline)}</P>
    case "ul":
    case "ol":
      return (
        <List key={index} ordered={block.t === "ol"}>
          {block.items.map((item, itemIndex) => <li key={itemIndex}>{item.map(renderInline)}</li>)}
        </List>
      )
    case "callout":
      return <Blockquote key={index} data-callout={block.kind}>{block.c.map(renderInline)}</Blockquote>
    case "code":
      return <pre key={index} data-lang={block.lang}><code>{block.v}</code></pre>
  }
}

export function ProseView({ prose }: { prose: Prose }) {
  return <div data-testid="prose" className="space-y-4">{prose.blocks.map(renderBlock)}</div>
}
