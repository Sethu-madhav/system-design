import { useState } from "react"
import { InkProvider } from "@/lib/ink/react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tape } from "@/components/ui/tape"
import { Sparkles, CheckCircle2, Pencil, Heart } from "lucide-react"

export default function App() {
  const [taskInput, setTaskInput] = useState("")
  const [tasks, setTasks] = useState([
    "Initialize React + TypeScript Vite project",
    "Configure pnpm and Instructions.md rules",
    "Set up Tailwind CSS v4 & shadcn Looseleaf registry",
  ])
  const [likes, setLikes] = useState(12)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskInput.trim()) return
    setTasks([...tasks, taskInput.trim()])
    setTaskInput("")
  }

  return (
    <InkProvider>
      <main className="min-h-screen py-10 px-4 flex flex-col items-center justify-start max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="relative text-center space-y-3 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="size-3.5 inline mr-1" /> Hand-Drawn UI
            </Badge>
            <Badge variant="default" className="text-sm">
              React 19 + TypeScript
            </Badge>
            <Badge variant="outline" className="text-sm">
              Tailwind v4
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-script tracking-tight text-ink font-bold">
            Looseleaf Component Playground
          </h1>
          <p className="text-lg text-pencil-text max-w-lg mx-auto font-hand">
            Hand-drawn shadcn/ui components rendered with pure vector ink on paper textures.
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card 1: Live Todo Notes */}
          <div className="relative">
            <Tape color="lemon" className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-28" />
            <Card stock="card" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="size-5" /> Setup Checklist
                </CardTitle>
                <CardDescription>
                  Keep track of your system design and component tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <Input
                    placeholder="Write a new task..."
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                  />
                  <Button type="submit" variant="default" size="default">
                    Add
                  </Button>
                </form>

                <ul className="space-y-2.5 pt-2">
                  {tasks.map((task, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-ink font-hand text-lg"
                    >
                      <CheckCircle2 className="size-4 text-green" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="text-xs text-pencil-text font-mono">
                {tasks.length} items on your scratchpad
              </CardFooter>
            </Card>
          </div>

          {/* Card 2: Button Variants & Interactive State */}
          <div className="relative">
            <Tape color="bubblegum" className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-28" />
            <Card stock="pad" className="h-full">
              <CardHeader>
                <CardTitle>Button & Ink Styles</CardTitle>
                <CardDescription>
                  Test hover, press, and reactive vector ink states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>

                <div className="pt-2 border-t border-dashed border-border flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-hand text-base text-ink">Interactive Ink Counter</p>
                    <p className="text-xs text-pencil-text">Click to trigger drawn state</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setLikes((l) => l + 1)}
                    className="flex items-center gap-2"
                  >
                    <Heart className="size-4 text-red fill-current" />
                    <span>{likes} Likes</span>
                  </Button>
                </div>

                <div className="p-3 bg-slip/80 rounded border border-pencil-mark/30 text-xs font-mono text-ink space-y-1">
                  <p className="font-bold">Add more components anytime:</p>
                  <code>pnpm dlx shadcn@latest add @looseleaf/&lt;component&gt;</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </InkProvider>
  )
}
