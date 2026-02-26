import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Document } from "@/types"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const { data, error: err } = await supabase
          .from("scrap_documents")
          .select("*")
          .order("year", { ascending: false })

        if (err) throw err

        const docs: Document[] = (data || []).map((row) => ({
          Title: row.title ?? "",
          Subject: row.subject ?? "",
          People: row.people ?? "",
          Classification: row.classification ?? "",
          "Company / organization": row.company_organization ?? "",
          Origin: row.origin ?? "",
          Signator: row.signator ?? "",
          Recipient: row.recipient ?? "",
          "Number of pages": row.number_of_pages ?? "",
          Date: row.date ?? "",
          Year: row.year ?? "",
          "DNSA collection": "",
          "Source type": "",
          "Language of publication": row.language ?? "",
          "Document type": row.document_type ?? "",
          "Document note": row.document_note ?? "",
          "Document number": row.document_number ?? "",
          "Accession number": row.accession_number ?? "",
          "ProQuest document ID": row.proquest_id ?? "",
          "Document URL": row.document_url ?? "",
          "Last updated": "",
          Database: "",
          ProQuest_URL: row.proquest_url ?? "",
          kDrive_FileID: row.kdrive_file_id ?? null,
          kDrive_Public_Link: row.kdrive_public_link ?? "",
          "Editorial note": row.editorial_note ?? "",
          Notes: row.notes ?? "",
          "Publication note": row.publication_note ?? "",
          URL: row.document_url ?? "",
          supabase_url: row.supabase_url ?? "",
        }))

        setDocuments(docs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando documentos")
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  return { documents, loading, error }
}
