export interface Document {
  Title: string
  Subject: string
  People: string
  Classification: string
  "Company / organization": string
  Origin: string
  Signator: string
  Recipient: string
  "Number of pages": string
  Date: string
  Year: string
  "DNSA collection": string
  "Source type": string
  "Language of publication": string
  "Document type": string
  "Document note": string
  "Document number": string
  "Accession number": string
  "ProQuest document ID": string
  "Document URL": string
  "Last updated": string
  Database: string
  ProQuest_URL: string
  kDrive_FileID: number | null
  kDrive_Public_Link: string
  "Editorial note": string
  Notes: string
  "Publication note": string
  URL: string
  supabase_url?: string
}

export interface SearchFilters {
  query: string
  documentTypes: Set<string>
  classifications: Set<string>
  yearFrom: string
  yearTo: string
  origins: Set<string>
  people: Set<string>
  hasKDriveLink: boolean | null
}
