import { Moon, Sun, Database, Network, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type ViewMode = "documents" | "graph"

interface HeaderProps {
  isDark: boolean
  onToggleTheme: () => void
  totalDocs: number
  resultCount: number
  activeView: ViewMode
  onChangeView: (view: ViewMode) => void
  onToggleSidebar: () => void
}

export function Header({ isDark, onToggleTheme, totalDocs, resultCount, activeView, onChangeView, onToggleSidebar }: HeaderProps) {
  return (
    <header className="border-b px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 md:hidden shrink-0"
          onClick={onToggleSidebar}
        >
          <Menu className="size-4" />
        </Button>
        <div className="flex items-center gap-2 shrink-0">
          <Database className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold tracking-tight hidden sm:inline">DNSA/Colombia</span>
          <span className="text-sm font-semibold tracking-tight sm:hidden">DNSA</span>
        </div>
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <div className="flex items-center gap-1">
          <Button
            variant={activeView === "documents" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onChangeView("documents")}
          >
            Documentos
          </Button>
          <Button
            variant={activeView === "graph" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2 gap-1"
            onClick={() => onChangeView("graph")}
          >
            <Network className="size-3" />
            Grafo
          </Button>
        </div>
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
          {resultCount.toLocaleString()}/{totalDocs.toLocaleString()} documentos
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={onToggleTheme} className="size-7 shrink-0">
        {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </Button>
    </header>
  )
}
