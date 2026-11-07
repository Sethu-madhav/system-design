import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icon } from "@/components/ui/icon"
import { THEMES, useTheme, type Theme } from "@/theme"

const LABEL: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" }
const GLYPH: Record<Theme, string> = { light: "sun", dark: "moon", system: "settings" }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" data-testid="theme-toggle" aria-label={`Theme: ${LABEL[theme]}. Change theme`}>
          <Icon name={GLYPH[theme]} size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" tilt={false} data-testid="theme-menu">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          {THEMES.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {LABEL[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
