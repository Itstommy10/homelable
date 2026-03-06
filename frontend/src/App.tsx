import { useEffect, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { CanvasContainer } from '@/components/canvas/CanvasContainer'
import { Sidebar } from '@/components/panels/Sidebar'
import { Toolbar } from '@/components/panels/Toolbar'
import { DetailPanel } from '@/components/panels/DetailPanel'
import { useCanvasStore } from '@/stores/canvasStore'
import { demoNodes, demoEdges } from '@/utils/demoData'

export default function App() {
  const { loadCanvas, markSaved, selectedNodeId } = useCanvasStore()

  // Load demo data on start
  useEffect(() => {
    loadCanvas(demoNodes, demoEdges)
  }, [loadCanvas])

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const handleSave = useCallback(() => {
    // TODO: POST /api/v1/canvas/save
    markSaved()
    toast.success('Canvas saved')
  }, [markSaved])

  const handleScan = useCallback(() => {
    toast.info('Network scan not yet implemented')
  }, [])

  const handleAutoLayout = useCallback(() => {
    toast.info('Auto-layout not yet implemented')
  }, [])

  const handleExport = useCallback(() => {
    toast.info('Export not yet implemented')
  }, [])

  const handleEditNode = useCallback((_id: string) => {
    toast.info('Edit node — not yet implemented')
  }, [])

  return (
    <TooltipProvider>
      <ReactFlowProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-[#0d1117]">
          <Sidebar
            onAddNode={() => toast.info('Add node — not yet implemented')}
            onScan={handleScan}
            onSave={handleSave}
          />
          <div className="flex flex-col flex-1 min-w-0">
            <Toolbar onSave={handleSave} onAutoLayout={handleAutoLayout} onExport={handleExport} />
            <div className="flex flex-1 min-h-0">
              <CanvasContainer />
              {selectedNodeId && <DetailPanel onEdit={handleEditNode} />}
            </div>
          </div>
        </div>
        <Toaster theme="dark" position="bottom-right" />
      </ReactFlowProvider>
    </TooltipProvider>
  )
}
