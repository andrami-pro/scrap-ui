import {
  Eye,
  Download,
  Shield,
  HardDrive,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Document } from "@/types"

const CLASSIFICATION_STYLES: Record<string, string> = {
  Secret: "bg-destructive/10 text-destructive border-destructive/20",
  Confidential: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Unclassified: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "Non-Classified": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "[Classification Unknown]": "bg-muted text-muted-foreground border-border",
  "[Classification Excised]": "bg-muted text-muted-foreground border-border",
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const regex = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(regex)
  return parts.map((part, i) =>
    terms.some((t) => part.toLowerCase() === t) ? (
      <mark key={i} className="bg-primary/15 text-foreground px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

interface ResultItemProps {
  doc: Document
  query: string
  index: number
  onView: (doc: Document) => void
}

export function ResultItem({ doc, query, index, onView }: ResultItemProps) {
  const pdfUrl = doc.supabase_url || doc.kDrive_Public_Link
  const isSupabase = !!doc.supabase_url

  const subjects = (doc.Subject ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="group border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="px-4 py-2.5 flex items-start gap-2">
        {/* Index */}
        <span className="text-[10px] text-muted-foreground tabular-nums mt-1 shrink-0 w-5 text-right">
          {index + 1}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title - clickable to open preview */}
          <button
            onClick={() => onView(doc)}
            className="text-left w-full"
          >
            <h3 className="text-sm font-medium leading-snug hover:underline decoration-muted-foreground/40 underline-offset-2">
              {highlightText(doc.Title, query)}
            </h3>
          </button>

          {/* Meta */}
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span className="tabular-nums">{doc.Date}</span>
            <span>&middot;</span>
            <span>{doc["Document type"]}</span>
            <span>&middot;</span>
            <span className="tabular-nums">{doc["Number of pages"]}pp</span>
            <span>&middot;</span>
            <span className="tabular-nums">{doc["Accession number"]}</span>
          </div>

          {/* Badges */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {doc.Classification ? (
              <Badge
                variant="outline"
                className={`text-[10px] h-4 px-1.5 gap-1 border ${CLASSIFICATION_STYLES[doc.Classification] ?? ""}`}
              >
                <Shield className="size-2.5" />
                {doc.Classification}
              </Badge>
            ) : null}
            {pdfUrl ? (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1">
                <HardDrive className="size-2.5" />
                {isSupabase ? "Supabase" : "kDrive"}
              </Badge>
            ) : null}
            {subjects.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px] h-4 px-1.5">
                {highlightText(s, query)}
              </Badge>
            ))}
            {subjects.length > 3 ? (
              <span className="text-[10px] text-muted-foreground">+{subjects.length - 3}</span>
            ) : null}
          </div>
        </div>

        {/* CTAs — siempre visibles en mobile (no hover) */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5"
                onClick={() => onView(doc)}
              >
                <Eye className="size-3.5" />
                Ver
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir vista previa del documento</TooltipContent>
          </Tooltip>

          {pdfUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5" />
                    PDF
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Descargar PDF desde {isSupabase ? "Supabase" : "kDrive"}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>
  )
}
