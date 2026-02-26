import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
  url: string
  fallbackUrl?: string
  title: string
}

export function PdfViewer({ url, fallbackUrl, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [loadError, setLoadError] = useState(false)

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setPageNumber(1)
    setLoadError(false)
  }, [])

  const onDocumentLoadError = useCallback(() => {
    setLoadError(true)
  }, [])

  const goToPrev = () => setPageNumber((p) => Math.max(1, p - 1))
  const goToNext = () => setPageNumber((p) => Math.min(numPages, p + 1))
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2))
  const zoomOut = () => setScale((s) => Math.max(0.4, s - 0.2))

  // Si react-pdf falla (CORS u otro), usamos Google Docs Viewer como iframe
  if (loadError) {
    const gviewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-1.5 border-b flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
          <AlertTriangle className="size-3" />
          <span>Visor alternativo (Google Docs)</span>
          {fallbackUrl ? (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              Abrir original
            </a>
          ) : null}
        </div>
        <iframe
          src={gviewUrl}
          className="flex-1 w-full border-0"
          title={title}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de herramientas */}
      <div className="px-3 py-1.5 border-b flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="size-6" onClick={goToPrev} disabled={pageNumber <= 1}>
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="text-[11px] tabular-nums text-muted-foreground min-w-16 text-center">
          {numPages > 0 ? `${pageNumber} / ${numPages}` : "Cargando..."}
        </span>
        <Button variant="ghost" size="icon" className="size-6" onClick={goToNext} disabled={pageNumber >= numPages}>
          <ChevronRight className="size-3.5" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="size-6" onClick={zoomOut} disabled={scale <= 0.4}>
          <ZoomOut className="size-3.5" />
        </Button>
        <span className="text-[11px] tabular-nums text-muted-foreground min-w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="size-6" onClick={zoomIn} disabled={scale >= 3}>
          <ZoomIn className="size-3.5" />
        </Button>
      </div>

      {/* Zona de renderizado del PDF */}
      <div className="flex-1 overflow-auto flex justify-center bg-muted/20 p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando PDF...
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Renderizando pagina...
              </div>
            }
          />
        </Document>
      </div>
    </div>
  )
}
