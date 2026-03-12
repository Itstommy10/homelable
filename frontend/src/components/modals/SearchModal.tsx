import { useState, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Search } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const nodes = useCanvasStore((s) => s.nodes)
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode)
  const { fitView } = useReactFlow()

  const searchable = nodes.filter((n) => n.data.type !== 'groupRect')
  const q = query.toLowerCase()
  const results = q.length === 0 ? [] : searchable.filter((n) =>
    n.data.label?.toLowerCase().includes(q) ||
    n.data.ip?.toLowerCase().includes(q) ||
    n.data.hostname?.toLowerCase().includes(q)
  ).slice(0, 8)

  const handleSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId)
    fitView({ nodes: [{ id: nodeId }], duration: 600, padding: 0.4, maxZoom: 1.5 })
    onClose()
    setQuery('')
  }, [fitView, setSelectedNode, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div
        className="bg-[#161b22] border border-border rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes by label, IP, hostname…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') { onClose(); setQuery('') }
              if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].id)
            }}
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1">ESC</kbd>
        </div>

        {results.length > 0 && (
          <ul className="py-1 max-h-64 overflow-y-auto">
            {results.map((node) => (
              <li
                key={node.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#21262d] cursor-pointer"
                onClick={() => handleSelect(node.id)}
              >
                <span className="text-xs font-mono text-[#00d4ff] w-16 shrink-0">{node.data.type}</span>
                <span className="text-sm text-foreground font-medium flex-1 truncate">{node.data.label}</span>
                {node.data.ip && (
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{node.data.ip}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {q.length > 0 && results.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">No nodes match "{query}"</p>
        )}

        {q.length === 0 && (
          <p className="px-4 py-3 text-xs text-muted-foreground">Type to search nodes…</p>
        )}
      </div>
    </div>
  )
}
