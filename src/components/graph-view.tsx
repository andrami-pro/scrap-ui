import { useRef, useCallback, useEffect, useState, useMemo } from "react"
import ForceGraph3D from "react-force-graph-3d"
import * as THREE from "three"
import { useGraph } from "@/hooks/use-graph"
import type { GraphNode } from "@/hooks/use-graph"
import { supabase } from "@/lib/supabase"
import { Loader2, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
const TYPE_COLORS: Record<string, string> = {
  persona: "#ef4444",
  organizacion: "#3b82f6",
  lugar: "#22c55e",
  keyword: "#6b7280",
}

const TYPE_LABELS: Record<string, string> = {
  persona: "Persona",
  organizacion: "Organizacion",
  lugar: "Lugar",
  keyword: "Keyword",
}

interface RelatedDoc {
  id: string
  title: string
  year: string
  classification: string
}

export function GraphView() {
  const { data, loading, error } = useGraph()
  const fgRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [relatedDocs, setRelatedDocs] = useState<RelatedDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Type filter state - all enabled by default
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(
    new Set(["persona", "organizacion", "lugar", "keyword"])
  )

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Top keywords/topics by number of connections (links)
  const topKeywords = useMemo(() => {
    const connectionCount = new Map<string, number>()
    for (const link of data.links) {
      const sourceId = typeof link.source === "object" ? (link.source as any).id : link.source
      const targetId = typeof link.target === "object" ? (link.target as any).id : link.target
      connectionCount.set(sourceId, (connectionCount.get(sourceId) || 0) + 1)
      connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1)
    }
    return data.nodes
      .filter((n) => n.group === "keyword" || n.group === "organizacion" || n.group === "persona" || n.group === "lugar")
      .map((n) => ({ ...n, connections: connectionCount.get(n.id) || 0 }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 30)
  }, [data.nodes, data.links])

  // Compute neighbor set for highlighting
  const neighborSet = useMemo(() => {
    if (!selectedNode) return null
    const neighbors = new Set<string>()
    neighbors.add(selectedNode.id)
    for (const link of data.links) {
      const sourceId = typeof link.source === "object" ? (link.source as any).id : link.source
      const targetId = typeof link.target === "object" ? (link.target as any).id : link.target
      if (sourceId === selectedNode.id) neighbors.add(targetId)
      if (targetId === selectedNode.id) neighbors.add(sourceId)
    }
    return neighbors
  }, [selectedNode, data.links])

  // Filter graph data by enabled types
  const filteredData = useMemo(() => {
    const visibleNodes = data.nodes.filter((n) => enabledTypes.has(n.group))
    const visibleIds = new Set(visibleNodes.map((n) => n.id))
    const visibleLinks = data.links.filter((l) => {
      const sourceId = typeof l.source === "object" ? (l.source as any).id : l.source
      const targetId = typeof l.target === "object" ? (l.target as any).id : l.target
      return visibleIds.has(sourceId) && visibleIds.has(targetId)
    })
    return { nodes: visibleNodes, links: visibleLinks }
  }, [data, enabledTypes])

  // Search suggestions grouped by type
  const groupedSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return {}
    const q = searchQuery.toLowerCase()
    const matches = data.nodes
      .filter((n) => n.name.toLowerCase().includes(q) && enabledTypes.has(n.group))
      .sort((a, b) => b.val - a.val)
      .slice(0, 20)
    const groups: Record<string, GraphNode[]> = {}
    for (const node of matches) {
      if (!groups[node.group]) groups[node.group] = []
      groups[node.group].push(node)
    }
    return groups
  }, [searchQuery, data.nodes, enabledTypes])

  const hasSuggestions = Object.keys(groupedSuggestions).length > 0

  // Connected entities grouped by type for the detail panel
  const connectedByType = useMemo(() => {
    if (!selectedNode || !neighborSet) return {}
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]))
    const groups: Record<string, GraphNode[]> = {}
    for (const id of neighborSet) {
      if (id === selectedNode.id) continue
      const node = nodeMap.get(id)
      if (!node) continue
      if (!groups[node.group]) groups[node.group] = []
      groups[node.group].push(node)
    }
    // Sort each group by val descending
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => b.val - a.val)
    }
    return groups
  }, [selectedNode, neighborSet, data.nodes])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectNode = useCallback(async (node: any) => {
    setSelectedNode(node as GraphNode)
    setSearchOpen(false)
    setLoadingDocs(true)

    try {
      // Buscar documentos relacionados a este nodo
      const { data: docNodes } = await supabase
        .from("scrap_document_nodes")
        .select("document_id")
        .eq("node_id", node.id)

      if (docNodes && docNodes.length > 0) {
        const docIds = docNodes.map((dn) => dn.document_id)
        const { data: docs } = await supabase
          .from("scrap_documents")
          .select("id, title, year, classification")
          .in("id", docIds)
          .limit(20)

        setRelatedDocs(
          (docs || []).map((d) => ({
            id: d.id,
            title: d.title || "Sin titulo",
            year: d.year || "",
            classification: d.classification || "",
          }))
        )
      } else {
        setRelatedDocs([])
      }
    } catch {
      setRelatedDocs([])
    } finally {
      setLoadingDocs(false)
    }

    // Mover camara al nodo (vista cenital 2D)
    if (fgRef.current && node.x !== undefined) {
      fgRef.current.cameraPosition(
        { x: node.x, y: node.y, z: 300 },
        { x: node.x, y: node.y, z: 0 },
        1000
      )
    }
  }, [])

  const handleSelectSuggestion = useCallback(
    (nodeId: string) => {
      const graphNodes = fgRef.current?.graphData?.()?.nodes || []
      const liveNode = graphNodes.find((n: any) => n.id === nodeId)
      if (liveNode) {
        selectNode(liveNode)
      } else {
        const staticNode = data.nodes.find((n) => n.id === nodeId)
        if (staticNode) selectNode(staticNode)
      }
    },
    [selectNode, data.nodes]
  )

  const toggleType = useCallback((type: string) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedNode(null)
    setRelatedDocs([])
  }, [])

  // Create node with label using THREE.js
  const nodeThreeObject = useCallback(
    (node: any) => {
      const group = new THREE.Group()

      // Sphere
      const baseColor = TYPE_COLORS[node.group] || "#6b7280"
      const isHighlighted = !neighborSet || neighborSet.has(node.id)
      const color = baseColor
      const radius = Math.cbrt(node.val || 1) * 2
      const geometry = new THREE.SphereGeometry(radius, 16, 16)
      const material = new THREE.MeshLambertMaterial({
        color,
        transparent: !isHighlighted,
        opacity: isHighlighted ? 1 : 0.15,
      })
      const sphere = new THREE.Mesh(geometry, material)
      group.add(sphere)

      // Text label via canvas sprite
      const name = node.name as string
      const label = name.length > 20 ? name.slice(0, 18) + "..." : name
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const fontSize = 28
      canvas.width = 512
      canvas.height = 64
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = isHighlighted ? "#ffffff" : "rgba(255,255,255,0.2)"
      ctx.fillText(label, 256, 32)

      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.scale.set(24, 3, 1)
      sprite.position.set(0, -(radius + 3), 0)
      group.add(sprite)

      return group
    },
    [neighborSet]
  )

  // Link color for highlighting connections to selected node
  const linkColor = useCallback(
    (link: any) => {
      if (!selectedNode) return "rgba(255,255,255,0.15)"
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target
      if (sourceId === selectedNode.id || targetId === selectedNode.id) {
        return "rgba(255,255,255,0.6)"
      }
      return "rgba(255,255,255,0.03)"
    },
    [selectedNode]
  )

  const linkWidth = useCallback(
    (link: any) => {
      if (!selectedNode) return Math.log((link.value || 1) + 1)
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target
      if (sourceId === selectedNode.id || targetId === selectedNode.id) {
        return Math.log((link.value || 1) + 1) * 2
      }
      return Math.log((link.value || 1) + 1) * 0.5
    },
    [selectedNode]
  )

  // Group topKeywords by type for sidebar display
  const topKeywordsByType = useMemo(() => {
    const groups: Record<string, typeof topKeywords> = {}
    for (const kw of topKeywords) {
      if (!groups[kw.group]) groups[kw.group] = []
      groups[kw.group].push(kw)
    }
    return groups
  }, [topKeywords])

  const maxConnections = topKeywords[0]?.connections || 1

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando grafo...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-destructive">Error: {error}</p>
      </div>
    )
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No hay datos en el grafo. Ejecuta el pipeline NLP primero.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex min-h-0 relative">
      {/* Full-page graph canvas */}
      <div ref={containerRef} className="flex-1 bg-black/95">
        <ForceGraph3D
          ref={fgRef}
          graphData={filteredData}
          width={dimensions.width}
          height={dimensions.height}
          numDimensions={2}
          nodeLabel="name"
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkWidth={linkWidth}
          linkOpacity={selectedNode ? 0.08 : 0.3}
          linkColor={linkColor}
          onNodeClick={selectNode}
          onBackgroundClick={clearSelection}
          backgroundColor="#0a0a0a"
        />
      </div>

      {/* Search + Filters overlay */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm flex flex-col gap-2 pointer-events-none">
        {/* Search bar */}
        <div ref={searchRef} className="w-full sm:w-80 pointer-events-auto">
          <Command className="border bg-background/90 backdrop-blur-sm rounded-md shadow-lg" shouldFilter={false}>
            <CommandInput
              placeholder="Buscar entidad (persona, lugar, organizacion...)"
              value={searchQuery}
              onValueChange={(v) => {
                setSearchQuery(v)
                setSearchOpen(v.length >= 2)
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) setSearchOpen(true)
              }}
            />
            {searchOpen && (
              <CommandList>
                {!hasSuggestions ? (
                  <CommandEmpty>No se encontraron entidades</CommandEmpty>
                ) : (
                  Object.entries(groupedSuggestions).map(([type, nodes]) => (
                    <CommandGroup key={type} heading={TYPE_LABELS[type] || type}>
                      {nodes.map((node) => (
                        <CommandItem
                          key={node.id}
                          value={node.id}
                          onSelect={() => handleSelectSuggestion(node.id)}
                        >
                          <div
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[node.group] }}
                          />
                          <span className="truncate">{node.name}</span>
                          <span className="ml-auto text-muted-foreground text-[10px]">
                            {node.val} doc{node.val !== 1 ? "s" : ""}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))
                )}
              </CommandList>
            )}
          </Command>
        </div>

        {/* Type filter toggles */}
        <div className="flex gap-1 pointer-events-auto overflow-x-auto">
          {Object.entries(TYPE_COLORS).map(([type, color]) => {
            const isActive = enabledTypes.has(type)
            const count = data.nodes.filter((n) => n.group === type).length
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all"
                style={{
                  backgroundColor: isActive ? color + "20" : "rgba(10,10,10,0.8)",
                  borderColor: isActive ? color + "60" : "rgba(255,255,255,0.1)",
                  color: isActive ? color : "rgba(255,255,255,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: isActive ? color : "rgba(255,255,255,0.2)" }}
                />
                <span className="capitalize">{type}</span>
                <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-3 left-3 bg-background/60 backdrop-blur-sm border rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground">
        {filteredData.nodes.length} nodos / {filteredData.links.length} enlaces
        {selectedNode && neighborSet && (
          <span className="ml-2 text-foreground">
            | {neighborSet.size - 1} conexiones
          </span>
        )}
      </div>

      {/* Floating right sidebar - Top keywords/topics (hidden on mobile) */}
      {!selectedNode && (
        <div
          className="absolute top-3 right-3 bottom-3 hidden sm:flex transition-all duration-300"
          style={{ width: sidebarCollapsed ? "auto" : "16rem" }}
        >
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="bg-background/80 backdrop-blur-sm border rounded-md px-2 py-2 shadow-lg hover:bg-background/90 transition-colors"
              title="Mostrar temas"
            >
              <ChevronRight className="size-3.5 text-muted-foreground rotate-180" />
            </button>
          ) : (
            <div className="w-full bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 border-b">
                <h3 className="text-xs font-semibold">Temas con mas relaciones</h3>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                {Object.entries(topKeywordsByType).map(([type, keywords]) => (
                  <div key={type}>
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <div
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[type] }}
                      />
                      {TYPE_LABELS[type] || type}
                    </h4>
                    <div className="space-y-0.5">
                      {keywords.map((kw) => (
                        <button
                          key={kw.id}
                          onClick={() => handleSelectSuggestion(kw.id)}
                          className="w-full text-left group flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/5 transition-colors"
                        >
                          <span className="text-[11px] truncate flex-1" style={{ color: TYPE_COLORS[kw.group] }}>
                            {kw.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(kw.connections / maxConnections) * 100}%`,
                                  backgroundColor: TYPE_COLORS[kw.group] + "80",
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground tabular-nums w-4 text-right">
                              {kw.connections}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel de detalle del nodo seleccionado */}
      {selectedNode && (
        <div className="absolute inset-x-3 bottom-3 top-auto max-h-[60vh] sm:top-3 sm:bottom-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-72 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg overflow-y-auto">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selectedNode.name}</h3>
                <span
                  className="text-xs px-1.5 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor: TYPE_COLORS[selectedNode.group] + "20",
                    color: TYPE_COLORS[selectedNode.group],
                  }}
                >
                  {selectedNode.group}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={clearSelection}
              >
                <X className="size-3" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Aparece en {selectedNode.val} documento(s)
            </div>

            {/* Entidades conectadas agrupadas por tipo */}
            {Object.keys(connectedByType).length > 0 && (
              <div className="border-t pt-3 space-y-3">
                {Object.entries(connectedByType).map(([type, nodes]) => (
                  <div key={type}>
                    <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                      <div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[type] }}
                      />
                      <span className="capitalize">{TYPE_LABELS[type] || type}</span>
                      <span className="text-muted-foreground font-normal">({nodes.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => handleSelectSuggestion(node.id)}
                          className="text-[11px] px-1.5 py-0.5 rounded border transition-colors hover:bg-muted truncate max-w-full text-left"
                          style={{
                            borderColor: TYPE_COLORS[node.group] + "40",
                            color: TYPE_COLORS[node.group],
                          }}
                        >
                          {node.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3">
              <h4 className="text-xs font-medium mb-2">Documentos relacionados</h4>
              {loadingDocs ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : relatedDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin documentos vinculados</p>
              ) : (
                <div className="space-y-2">
                  {relatedDocs.map((doc) => (
                    <div key={doc.id} className="text-xs border rounded p-2 space-y-1">
                      <p className="font-medium leading-tight">{doc.title}</p>
                      <div className="flex gap-2 text-muted-foreground">
                        {doc.year && <span>{doc.year}</span>}
                        {doc.classification && <span>{doc.classification}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
