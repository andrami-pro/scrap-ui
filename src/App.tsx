import { useState, useCallback } from "react"
import { Header } from "@/components/header"
import { SearchBar } from "@/components/search-bar"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ActiveFilters } from "@/components/active-filters"
import { ResultsPanel } from "@/components/results-panel"
import { DocumentPreview } from "@/components/document-preview"
import { GraphView } from "@/components/graph-view"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useDocuments } from "@/hooks/use-documents"
import { useSearch } from "@/hooks/use-search"
import { useDarkMode } from "@/hooks/use-dark-mode"
import type { Document } from "@/types"
import type { ViewMode } from "@/components/header"

export default function App() {
  const { isDark, toggle } = useDarkMode()
  const { documents, loading, error } = useDocuments()
  const {
    filters,
    facets,
    results,
    searchTimeMs,
    totalCount,
    activeFilterCount,
    setQuery,
    toggleSetFilter,
    setYearRange,
    setKDriveFilter,
    clearAllFilters,
    removeFilter,
  } = useSearch(documents)

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [activeView, setActiveView] = useState<ViewMode>("documents")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleViewDocument = useCallback((doc: Document) => {
    setPreviewDoc(doc)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewDoc(null)
  }, [])

  const filterSidebarProps = {
    filters,
    facets,
    activeFilterCount,
    onToggleSetFilter: toggleSetFilter,
    onSetYearRange: setYearRange,
    onSetKDriveFilter: setKDriveFilter,
    onClearAll: clearAllFilters,
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-mono">
      <Header
        isDark={isDark}
        onToggleTheme={toggle}
        totalDocs={totalCount}
        resultCount={results.length}
        activeView={activeView}
        onChangeView={setActiveView}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {activeView === "documents" ? (
        <>
          <SearchBar
            query={filters.query}
            onQueryChange={setQuery}
            resultCount={results.length}
            searchTimeMs={searchTimeMs}
            results={results}
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setSidebarOpen(true)}
          />
          <ActiveFilters filters={filters} onRemoveFilter={removeFilter} />
          <div className="flex flex-1 min-h-0">
            {/* Desktop sidebar */}
            <FilterSidebar
              className="hidden md:flex"
              {...filterSidebarProps}
            />
            <ResultsPanel
              documents={results}
              query={filters.query}
              loading={loading}
              error={error}
              onViewDocument={handleViewDocument}
            />
          </div>

          {/* Mobile sidebar sheet */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
              <SheetHeader className="sr-only">
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <FilterSidebar
                className="flex w-full border-r-0"
                {...filterSidebarProps}
              />
            </SheetContent>
          </Sheet>

          <DocumentPreview
            doc={previewDoc}
            open={previewDoc !== null}
            onClose={handleClosePreview}
          />
        </>
      ) : (
        <GraphView />
      )}
    </div>
  )
}
