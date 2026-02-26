import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { lazy, Suspense, useState, useEffect } from "react"
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Shield,
  ChevronDown,
  X,
  Loader2,
  FileText,
} from "lucide-react"
import type { Document } from "@/types"

const PdfViewer = lazy(() =>
  import("@/components/pdf-viewer").then((m) => ({ default: m.PdfViewer }))
)

function PdfLoading() {
  return (
    <div className="flex items-center justify-center h-full bg-muted/20">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando visor de PDF...
      </div>
    </div>
  )
}

const CLASSIFICATION_STYLES: Record<string, string> = {
  Secret: "bg-destructive/10 text-destructive border-destructive/20",
  Confidential: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Unclassified: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "Non-Classified": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "[Classification Unknown]": "bg-muted text-muted-foreground border-border",
  "[Classification Excised]": "bg-muted text-muted-foreground border-border",
}

function MetaRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null
  return (
    <div className="text-xs py-1.5 border-b border-border/50 last:border-b-0">
      <span className="text-muted-foreground font-medium block mb-0.5">{label}</span>
      <span className="leading-relaxed break-words">{value}</span>
    </div>
  )
}

interface DocumentPreviewProps {
  doc: Document | null
  open: boolean
  onClose: () => void
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])
  return mobile
}

export function DocumentPreview({ doc, open, onClose }: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false)
  const isMobile = useIsMobile()

  if (!doc) return null

  const handleCopy = () => {
    const cite = `"${doc.Title}," ${doc["Document type"]}, ${doc.Date}. ${doc["Accession number"]}. ${doc.Database}.`
    navigator.clipboard.writeText(cite)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const subjects = (doc.Subject ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)

  const pdfUrl = doc.supabase_url || doc.kDrive_Public_Link
  const hasPdf = !!pdfUrl

  // kDrive necesita /download para descarga directa, Supabase no
  const pdfDownloadUrl = doc.supabase_url
    ? doc.supabase_url
    : (doc.kDrive_Public_Link ? `${doc.kDrive_Public_Link}/download` : "")

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={`p-0 flex flex-col ${isMobile ? "!w-[calc(100%-2rem)] !max-w-[calc(100%-2rem)] !h-[calc(100%-2rem)] !max-h-[calc(100%-2rem)] !top-4 !right-4 !bottom-4 !rounded-xl !border !shadow-xl" : "!w-[85vw] !max-w-[85vw]"}`}
      >
        {/* Mobile: barra de cerrar sticky */}
        {isMobile && (
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center gap-1.5 py-2.5 border-b bg-muted/30 active:bg-muted/60 transition-colors"
          >
            <ChevronDown className="size-4 rotate-[-90deg] text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Cerrar</span>
          </button>
        )}

        {/* Header */}
        <SheetHeader className="px-4 sm:px-6 pt-3 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-sm sm:text-base font-semibold leading-snug">
                {doc.Title}
              </SheetTitle>
              <SheetDescription className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                <span className="tabular-nums">{doc.Date}</span>
                <span className="text-border">/</span>
                <span>{doc["Document type"]}</span>
                {!isMobile && (
                  <>
                    <span className="text-border">/</span>
                    <span className="tabular-nums">{doc["Number of pages"]} paginas</span>
                  </>
                )}
                {doc.Classification ? (
                  <>
                    <span className="text-border">/</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 px-1.5 gap-1 border ${CLASSIFICATION_STYLES[doc.Classification] ?? ""}`}
                    >
                      <Shield className="size-2.5" />
                      {doc.Classification}
                    </Badge>
                  </>
                ) : null}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2 sm:px-3" onClick={handleCopy}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copiado" : "Citar"}</span>
              </Button>
              {!isMobile && hasPdf ? (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2 sm:px-3" asChild>
                  <a href={pdfDownloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5" />
                    <span className="hidden sm:inline">Descargar PDF</span>
                  </a>
                </Button>
              ) : null}
              {doc["Document URL"] ? (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2 sm:px-3 hidden sm:inline-flex" asChild>
                  <a href={doc["Document URL"]} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    ProQuest
                  </a>
                </Button>
              ) : null}
              {!isMobile && (
                <>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
                    <X className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Cuerpo: PDF (70%) + Metadatos (30%) — solo metadatos en mobile */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Visor de PDF — solo en desktop */}
          {!isMobile && (
            <div className="flex-[7] min-w-0 min-h-0">
              {hasPdf ? (
                <Suspense fallback={<PdfLoading />}>
                  <PdfViewer
                    url={pdfDownloadUrl}
                    fallbackUrl={pdfUrl}
                    title={doc.Title}
                  />
                </Suspense>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/20">
                  <div className="text-center space-y-3 max-w-xs">
                    <p className="text-sm text-muted-foreground">PDF no disponible</p>
                    <p className="text-xs text-muted-foreground/70">
                      Este documento no tiene enlace de descarga en kDrive
                    </p>
                    {doc["Document URL"] ? (
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <a href={doc["Document URL"]} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3 mr-1.5" />
                          Ver en ProQuest
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel de metadatos — sidebar derecho en desktop, contenido principal en mobile */}
          <div className={isMobile ? "flex-1 min-h-0" : "flex-[3] shrink-0 min-w-[280px] max-w-[380px] border-l"}>
            <ScrollArea className="h-full">
              <div className="p-5 space-y-4">
                {/* Boton de descarga prominente en mobile */}
                {isMobile && hasPdf ? (
                  <Button className="w-full gap-2" asChild>
                    <a href={pdfDownloadUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-4" />
                      Descargar PDF
                    </a>
                  </Button>
                ) : null}

                {/* Informacion general */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Informacion general
                  </h4>
                  <div className="space-y-0">
                    <MetaRow label="Tipo de documento" value={doc["Document type"]} />
                    <MetaRow label="Clasificacion" value={doc.Classification} />
                    <MetaRow label="Fecha" value={doc.Date} />
                    <MetaRow label="Ano" value={doc.Year} />
                    <MetaRow label="Paginas" value={doc["Number of pages"]} />
                    <MetaRow label="Idioma" value={doc["Language of publication"]} />
                  </div>
                </section>

                <Separator />

                {/* Personas y organizaciones */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Personas y organizaciones
                  </h4>
                  <div className="space-y-0">
                    <MetaRow label="Origen" value={doc.Origin} />
                    <MetaRow label="Firmante" value={doc.Signator} />
                    <MetaRow label="Destinatario" value={doc.Recipient} />
                    <MetaRow label="Organizaciones" value={doc["Company / organization"]} />
                    <MetaRow label="Personas" value={doc.People} />
                  </div>
                </section>

                <Separator />

                {/* Coleccion */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Coleccion y base de datos
                  </h4>
                  <div className="space-y-0">
                    <MetaRow label="Coleccion DNSA" value={doc["DNSA collection"]} />
                    <MetaRow label="Base de datos" value={doc.Database} />
                    <MetaRow label="No. de acceso" value={doc["Accession number"]} />
                    <MetaRow label="ID ProQuest" value={doc["ProQuest document ID"]} />
                    <MetaRow label="Tipo de fuente" value={doc["Source type"]} />
                  </div>
                </section>

                {/* Notas */}
                {doc["Document note"] || doc["Editorial note"] || doc.Notes ? (
                  <>
                    <Separator />
                    <section>
                      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Notas
                      </h4>
                      <div className="space-y-2">
                        {doc["Document note"] ? (
                          <div className="text-xs border-l-2 border-border pl-3 py-1">
                            <span className="text-muted-foreground font-medium block mb-0.5">Del documento</span>
                            <p className="leading-relaxed">{doc["Document note"]}</p>
                          </div>
                        ) : null}
                        {doc["Editorial note"] ? (
                          <div className="text-xs border-l-2 border-border pl-3 py-1">
                            <span className="text-muted-foreground font-medium block mb-0.5">Editorial</span>
                            <p className="leading-relaxed italic">{doc["Editorial note"]}</p>
                          </div>
                        ) : null}
                        {doc.Notes ? (
                          <div className="text-xs border-l-2 border-border pl-3 py-1">
                            <span className="text-muted-foreground font-medium block mb-0.5">Generales</span>
                            <p className="leading-relaxed">{doc.Notes}</p>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  </>
                ) : null}

                {/* Temas */}
                {subjects.length > 0 ? (
                  <>
                    <Separator />
                    <section>
                      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Temas
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[11px] px-2 py-0.5">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  </>
                ) : null}

                {/* Enlaces */}
                <Separator />
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Enlaces
                  </h4>
                  <div className="space-y-2">
                    {doc["Document URL"] ? (
                      <a
                        href={doc["Document URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        ProQuest
                      </a>
                    ) : null}
                    {doc.supabase_url ? (
                      <a
                        href={doc.supabase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Download className="size-3.5 shrink-0" />
                        Supabase
                      </a>
                    ) : null}
                    {doc.kDrive_Public_Link ? (
                      <a
                        href={doc.kDrive_Public_Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Download className="size-3.5 shrink-0" />
                        kDrive
                      </a>
                    ) : null}
                  </div>
                </section>

                {doc["Last updated"] ? (
                  <>
                    <Separator />
                    <p className="text-[10px] text-muted-foreground">
                      Ultima actualizacion: {doc["Last updated"]}
                    </p>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
