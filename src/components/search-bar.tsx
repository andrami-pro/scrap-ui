import { useRef, useEffect, useCallback } from "react"
import { Search, Command, Download, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Document } from "@/types"

const CSV_COLUMNS: (keyof Document)[] = [
  "Title", "Subject", "People", "Classification", "Company / organization",
  "Origin", "Signator", "Recipient", "Number of pages", "Date", "Year",
  "DNSA collection", "Source type", "Language of publication", "Document type",
  "Document note", "Document number", "Accession number", "ProQuest document ID",
  "Document URL", "Last updated", "Database", "ProQuest_URL", "kDrive_FileID",
  "kDrive_Public_Link", "Editorial note", "Notes", "Publication note", "URL",
  "supabase_url",
]

function escapeCsvField(value: unknown): string {
  const str = value == null ? "" : String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  resultCount: number
  searchTimeMs: number
  results: Document[]
  activeFilterCount?: number
  onOpenFilters?: () => void
}

export function SearchBar({ query, onQueryChange, resultCount, searchTimeMs, results, activeFilterCount = 0, onOpenFilters }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const exportCsv = useCallback(() => {
    if (results.length === 0) return
    const header = CSV_COLUMNS.map(escapeCsvField).join(",")
    const rows = results.map((doc) =>
      CSV_COLUMNS.map((col) => escapeCsvField(doc[col])).join(",")
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dnsa_colombia_${results.length}_docs.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [results])

  return (
    <div className="px-3 sm:px-4 py-3 border-b">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por titulo, personas, temas, origen, organizaciones..."
          className="pl-8 pr-20 h-9 text-sm"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground border px-1.5 py-0.5">
            <Command className="size-2.5" />K
          </kbd>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
        <span>{resultCount.toLocaleString()} resultados</span>
        <span>&middot;</span>
        <span>{searchTimeMs.toFixed(2)}ms</span>
        <span className="flex-1" />
        {onOpenFilters ? (
          <Button
            variant="outline"
            size="sm"
            className="h-5 px-1.5 text-[11px] gap-1 md:hidden"
            onClick={onOpenFilters}
          >
            <SlidersHorizontal className="size-3" />
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[11px] gap-1 hidden md:inline-flex"
          onClick={exportCsv}
          disabled={results.length === 0}
        >
          <Download className="size-3" />
          Exportar CSV
        </Button>
      </div>
    </div>
  )
}
