import { useState, useMemo, useCallback } from "react"
import type { Document, SearchFilters } from "@/types"

const EMPTY_FILTERS: SearchFilters = {
  query: "",
  documentTypes: new Set(),
  classifications: new Set(),
  yearFrom: "",
  yearTo: "",
  origins: new Set(),
  people: new Set(),
  hasKDriveLink: null,
}

function matchesQuery(doc: Document, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const terms = q.split(/\s+/).filter(Boolean)
  const searchable = [
    doc.Title,
    doc.Subject,
    doc.People,
    doc.Origin,
    doc["Company / organization"],
    doc.Signator,
    doc.Recipient,
    doc["Document note"],
    doc["Editorial note"],
    doc.Notes,
    doc["Accession number"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return terms.every((term) => searchable.includes(term))
}

function matchesFilters(doc: Document, filters: SearchFilters): boolean {
  if (filters.documentTypes.size > 0 && !filters.documentTypes.has(doc["Document type"] ?? "")) {
    return false
  }
  if (filters.classifications.size > 0 && !filters.classifications.has(doc.Classification ?? "")) {
    return false
  }
  if (filters.origins.size > 0) {
    const origin = doc.Origin ?? ""
    if (!filters.origins.has(origin)) return false
  }
  if (filters.people.size > 0) {
    const docPeople = (doc.People ?? "")
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
    const hasMatch = docPeople.some((p) => filters.people.has(p))
    if (!hasMatch) return false
  }
  if (filters.yearFrom) {
    const year = parseInt(doc.Year ?? "0")
    if (year < parseInt(filters.yearFrom)) return false
  }
  if (filters.yearTo) {
    const year = parseInt(doc.Year ?? "9999")
    if (year > parseInt(filters.yearTo)) return false
  }
  if (filters.hasKDriveLink === true) {
    if (!doc.kDrive_Public_Link && !doc.supabase_url) return false
  }
  if (filters.hasKDriveLink === false) {
    if (doc.kDrive_Public_Link || doc.supabase_url) return false
  }
  return true
}

/** Extract unique sorted values for a field across all documents */
function extractUnique(docs: Document[], getter: (d: Document) => string): string[] {
  const set = new Set<string>()
  for (const doc of docs) {
    const val = getter(doc)
    if (val) set.add(val)
  }
  return Array.from(set).sort()
}

/** Extract unique people (semicolon-separated) */
function extractPeople(docs: Document[]): string[] {
  const set = new Set<string>()
  for (const doc of docs) {
    if (doc.People) {
      for (const p of doc.People.split(";")) {
        const trimmed = p.trim()
        if (trimmed) set.add(trimmed)
      }
    }
  }
  return Array.from(set).sort()
}

export function useSearch(documents: Document[]) {
  const [filters, setFilters] = useState<SearchFilters>(() => ({ ...EMPTY_FILTERS }))

  // Derive facet options from the full dataset
  const facets = useMemo(() => ({
    documentTypes: extractUnique(documents, (d) => d["Document type"]),
    classifications: extractUnique(documents, (d) => d.Classification),
    origins: extractUnique(documents, (d) => d.Origin),
    people: extractPeople(documents),
    years: extractUnique(documents, (d) => d.Year).sort((a, b) => parseInt(a) - parseInt(b)),
  }), [documents])

  const results = useMemo(() => {
    const start = performance.now()
    const filtered = documents.filter(
      (doc) => matchesQuery(doc, filters.query) && matchesFilters(doc, filters)
    )
    const elapsed = performance.now() - start
    return { docs: filtered, timeMs: elapsed }
  }, [documents, filters])

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }))
  }, [])

  const toggleSetFilter = useCallback(
    (key: "documentTypes" | "classifications" | "origins" | "people", value: string) => {
      setFilters((prev) => {
        const next = new Set(prev[key])
        if (next.has(value)) next.delete(value)
        else next.add(value)
        return { ...prev, [key]: next }
      })
    },
    []
  )

  const setYearRange = useCallback((from: string, to: string) => {
    setFilters((prev) => ({ ...prev, yearFrom: from, yearTo: to }))
  }, [])

  const setKDriveFilter = useCallback((value: boolean | null) => {
    setFilters((prev) => ({ ...prev, hasKDriveLink: value }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS })
  }, [])

  const removeFilter = useCallback((key: string, value?: string) => {
    setFilters((prev) => {
      if (key === "query") return { ...prev, query: "" }
      if (key === "yearRange") return { ...prev, yearFrom: "", yearTo: "" }
      if (key === "kDriveLink") return { ...prev, hasKDriveLink: null }
      if (
        key === "documentTypes" ||
        key === "classifications" ||
        key === "origins" ||
        key === "people"
      ) {
        const next = new Set(prev[key])
        if (value) next.delete(value)
        return { ...prev, [key]: next }
      }
      return prev
    })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    count += filters.documentTypes.size
    count += filters.classifications.size
    count += filters.origins.size
    count += filters.people.size
    if (filters.yearFrom || filters.yearTo) count += 1
    if (filters.hasKDriveLink !== null) count += 1
    return count
  }, [filters])

  return {
    filters,
    facets,
    results: results.docs,
    searchTimeMs: results.timeMs,
    totalCount: documents.length,
    activeFilterCount,
    setQuery,
    toggleSetFilter,
    setYearRange,
    setKDriveFilter,
    clearAllFilters,
    removeFilter,
  }
}
