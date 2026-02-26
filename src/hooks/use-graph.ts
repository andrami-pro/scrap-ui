import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface GraphNode {
  id: string
  name: string
  group: string
  val: number
}

export interface GraphLink {
  source: string
  target: string
  value: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export function useGraph() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGraph() {
      try {
        const [nodesRes, linksRes] = await Promise.all([
          supabase.from("scrap_nodes").select("*"),
          supabase.from("scrap_links").select("*"),
        ])

        if (nodesRes.error) throw nodesRes.error
        if (linksRes.error) throw linksRes.error

        const nodes: GraphNode[] = (nodesRes.data || []).map((n) => ({
          id: n.id,
          name: n.name,
          group: n.type,
          val: n.val,
        }))

        const links: GraphLink[] = (linksRes.data || []).map((l) => ({
          source: l.source,
          target: l.target,
          value: l.strength,
        }))

        setData({ nodes, links })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando grafo")
      } finally {
        setLoading(false)
      }
    }

    fetchGraph()
  }, [])

  return { data, loading, error }
}
