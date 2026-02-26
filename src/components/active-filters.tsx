import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { SearchFilters } from "@/types"

const PREFIXES: Record<string, string> = {
  documentTypes: "Tipo",
  classifications: "Clasif.",
  origins: "Origen",
  people: "Persona",
  yearRange: "Ano",
  kDriveLink: "PDF",
}

interface ActiveFiltersProps {
  filters: SearchFilters
  onRemoveFilter: (key: string, value?: string) => void
}

export function ActiveFilters({ filters, onRemoveFilter }: ActiveFiltersProps) {
  const chips: { key: string; value?: string; label: string; prefix: string }[] = []

  for (const type of filters.documentTypes) {
    chips.push({ key: "documentTypes", value: type, label: type, prefix: PREFIXES.documentTypes })
  }
  for (const cls of filters.classifications) {
    chips.push({ key: "classifications", value: cls, label: cls, prefix: PREFIXES.classifications })
  }
  for (const origin of filters.origins) {
    chips.push({ key: "origins", value: origin, label: origin, prefix: PREFIXES.origins })
  }
  for (const person of filters.people) {
    chips.push({ key: "people", value: person, label: person, prefix: PREFIXES.people })
  }
  if (filters.yearFrom || filters.yearTo) {
    const from = filters.yearFrom || "..."
    const to = filters.yearTo || "..."
    chips.push({ key: "yearRange", label: `${from}–${to}`, prefix: PREFIXES.yearRange })
  }
  if (filters.hasKDriveLink !== null) {
    chips.push({
      key: "kDriveLink",
      label: filters.hasKDriveLink ? "Con archivo" : "Sin archivo",
      prefix: PREFIXES.kDriveLink,
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="px-3 sm:px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto flex-nowrap sm:flex-wrap">
      <span className="text-[10px] text-muted-foreground mr-1">Activos:</span>
      {chips.map((chip, i) => (
        <Badge
          key={`${chip.key}-${chip.value ?? i}`}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-muted"
          onClick={() => onRemoveFilter(chip.key, chip.value)}
        >
          <span className="text-muted-foreground">{chip.prefix}:</span>
          <span className="max-w-40 truncate">{chip.label}</span>
          <X className="size-2.5" />
        </Badge>
      ))}
    </div>
  )
}
