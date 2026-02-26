import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, RotateCcw, HardDrive } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { SearchFilters } from "@/types"

interface FilterSidebarProps {
  className?: string
  filters: SearchFilters
  facets: {
    documentTypes: string[]
    classifications: string[]
    origins: string[]
    people: string[]
    years: string[]
  }
  activeFilterCount: number
  onToggleSetFilter: (key: "documentTypes" | "classifications" | "origins" | "people", value: string) => void
  onSetYearRange: (from: string, to: string) => void
  onSetKDriveFilter: (value: boolean | null) => void
  onClearAll: () => void
}

function FilterSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          {title}
        </span>
        {count ? (
          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 tabular-nums">
            {count}
          </span>
        ) : null}
      </button>
      {open ? <div className="px-3 pb-2 space-y-1.5">{children}</div> : null}
    </div>
  )
}

function CheckboxItem({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="size-3.5" />
      <Label htmlFor={id} className="text-xs font-normal cursor-pointer leading-none truncate">
        {label}
      </Label>
    </div>
  )
}

function SearchableCheckboxList({
  items,
  selected,
  filterKey,
  onToggle,
  placeholder,
}: {
  items: string[]
  selected: Set<string>
  filterKey: "documentTypes" | "classifications" | "origins" | "people"
  onToggle: (key: typeof filterKey, value: string) => void
  placeholder: string
}) {
  const [search, setSearch] = useState("")
  const filtered = search
    ? items.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <>
      {items.length > 5 ? (
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-6 text-[11px] px-1.5 mb-1.5"
        />
      ) : null}
      <div className="max-h-40 overflow-y-auto space-y-1.5">
        {filtered.map((item) => (
          <CheckboxItem
            key={item}
            id={`${filterKey}-${item}`}
            label={item}
            checked={selected.has(item)}
            onChange={() => onToggle(filterKey, item)}
          />
        ))}
        {filtered.length === 0 ? (
          <p className="text-[10px] text-muted-foreground py-1">Sin coincidencias</p>
        ) : null}
      </div>
    </>
  )
}

export function FilterSidebar({
  className,
  filters,
  facets,
  activeFilterCount,
  onToggleSetFilter,
  onSetYearRange,
  onSetKDriveFilter,
  onClearAll,
}: FilterSidebarProps) {
  const yearMin = facets.years[0] ?? ""
  const yearMax = facets.years[facets.years.length - 1] ?? ""

  return (
    <div className={cn("w-64 shrink-0 border-r flex flex-col", className)}>
      <div className="px-3 py-2.5 flex items-center justify-between border-b">
        <span className="text-xs font-semibold">Filtros</span>
        {activeFilterCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-5 text-[10px] px-1.5 gap-1 text-muted-foreground"
          >
            <RotateCcw className="size-2.5" />
            Limpiar ({activeFilterCount})
          </Button>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {/* kDrive */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="kdrive-link"
                checked={filters.hasKDriveLink === true}
                onCheckedChange={(checked) => onSetKDriveFilter(checked ? true : null)}
                className="size-3.5"
              />
              <Label htmlFor="kdrive-link" className="text-xs font-normal cursor-pointer flex items-center gap-1.5">
                <HardDrive className="size-3 text-muted-foreground" />
                Con PDF disponible
              </Label>
            </div>
          </div>

          <Separator />

          {/* Tipo de documento */}
          <FilterSection
            title="Tipo de documento"
            count={filters.documentTypes.size || undefined}
            defaultOpen
          >
            <SearchableCheckboxList
              items={facets.documentTypes}
              selected={filters.documentTypes}
              filterKey="documentTypes"
              onToggle={onToggleSetFilter}
              placeholder="Filtrar tipos..."
            />
          </FilterSection>

          <Separator />

          {/* Clasificacion */}
          <FilterSection
            title="Clasificacion"
            count={filters.classifications.size || undefined}
            defaultOpen
          >
            <SearchableCheckboxList
              items={facets.classifications}
              selected={filters.classifications}
              filterKey="classifications"
              onToggle={onToggleSetFilter}
              placeholder="Filtrar..."
            />
          </FilterSection>

          <Separator />

          {/* Rango de anos */}
          <FilterSection
            title="Rango de anos"
            count={filters.yearFrom || filters.yearTo ? 1 : undefined}
            defaultOpen
          >
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={yearMin}
                max={yearMax}
                placeholder={yearMin}
                value={filters.yearFrom}
                onChange={(e) => onSetYearRange(e.target.value, filters.yearTo)}
                className="h-7 text-[11px] px-1.5 tabular-nums"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">&ndash;</span>
              <Input
                type="number"
                min={yearMin}
                max={yearMax}
                placeholder={yearMax}
                value={filters.yearTo}
                onChange={(e) => onSetYearRange(filters.yearFrom, e.target.value)}
                className="h-7 text-[11px] px-1.5 tabular-nums"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Rango: {yearMin} — {yearMax}
            </p>
          </FilterSection>

          <Separator />

          {/* Origen */}
          <FilterSection
            title="Origen"
            count={filters.origins.size || undefined}
          >
            <SearchableCheckboxList
              items={facets.origins}
              selected={filters.origins}
              filterKey="origins"
              onToggle={onToggleSetFilter}
              placeholder="Buscar origen..."
            />
          </FilterSection>

          <Separator />

          {/* Personas */}
          <FilterSection
            title="Personas"
            count={filters.people.size || undefined}
          >
            <SearchableCheckboxList
              items={facets.people}
              selected={filters.people}
              filterKey="people"
              onToggle={onToggleSetFilter}
              placeholder="Buscar persona..."
            />
          </FilterSection>
        </div>
      </ScrollArea>
    </div>
  )
}
