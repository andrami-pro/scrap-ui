import { useState, useEffect, useCallback, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResultItem } from "@/components/result-item"
import { Button } from "@/components/ui/button"
import { FileSearch, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import type { Document } from "@/types"

const MOBILE_PAGE_SIZE = 10

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

interface ResultsPanelProps {
  documents: Document[]
  query: string
  loading: boolean
  error: string | null
  onViewDocument: (doc: Document) => void
}

export function ResultsPanel({ documents, query, loading, error, onViewDocument }: ResultsPanelProps) {
  const isMobile = useIsMobile()
  const [page, setPage] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset page when results change
  useEffect(() => { setPage(0) }, [documents.length, query])

  const totalPages = isMobile ? Math.ceil(documents.length / MOBILE_PAGE_SIZE) : 1
  const visibleDocs = isMobile
    ? documents.slice(page * MOBILE_PAGE_SIZE, (page + 1) * MOBILE_PAGE_SIZE)
    : documents

  const goToPage = useCallback((p: number) => {
    setPage(p)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="size-5 text-muted-foreground animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">Error al cargar datos</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <FileSearch className="size-8 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">Sin resultados</p>
          <p className="text-xs text-muted-foreground/70">
            Intenta ajustar la busqueda o los filtros
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div>
        {visibleDocs.map((doc, i) => (
          <ResultItem
            key={doc["ProQuest document ID"] ?? (page * MOBILE_PAGE_SIZE + i)}
            doc={doc}
            query={query}
            index={page * MOBILE_PAGE_SIZE + i}
            onView={onViewDocument}
          />
        ))}
      </div>

      {/* Paginacion mobile */}
      {isMobile && totalPages > 1 ? (
        <div className="px-3 py-3 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="size-3.5" />
            Anterior
          </Button>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Siguiente
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </ScrollArea>
  )
}
