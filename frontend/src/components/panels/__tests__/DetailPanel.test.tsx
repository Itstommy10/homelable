import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DetailPanel } from '../DetailPanel'
import * as canvasStore from '@/stores/canvasStore'
import type { NodeData } from '@/types'
import type { Node } from '@xyflow/react'

vi.mock('@/stores/canvasStore')

function makeNode(data: Partial<NodeData>): Node<NodeData> {
  return {
    id: 'n1',
    type: data.type ?? 'server',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Node',
      type: 'server',
      status: 'online',
      services: [],
      ...data,
    },
  }
}

function setupStore(nodeData: Partial<NodeData> = {}) {
  vi.mocked(canvasStore.useCanvasStore).mockReturnValue({
    nodes: [makeNode(nodeData)],
    selectedNodeId: 'n1',
    setSelectedNode: vi.fn(),
    deleteNode: vi.fn(),
    updateNode: vi.fn(),
  } as unknown as ReturnType<typeof canvasStore.useCanvasStore>)
}

describe('DetailPanel', () => {
  beforeEach(() => {
    vi.mocked(canvasStore.useCanvasStore).mockReturnValue({
      nodes: [],
      selectedNodeId: null,
      setSelectedNode: vi.fn(),
      deleteNode: vi.fn(),
      updateNode: vi.fn(),
    } as unknown as ReturnType<typeof canvasStore.useCanvasStore>)
  })

  it('renders nothing when no node is selected', () => {
    const { container } = render(<DetailPanel onEdit={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders node label and status', () => {
    setupStore({ label: 'My Server', status: 'online' })
    render(<DetailPanel onEdit={vi.fn()} />)
    expect(screen.getByText('My Server')).toBeDefined()
    expect(screen.getByText('online')).toBeDefined()
  })

  it('renders nothing for groupRect nodes', () => {
    setupStore({ type: 'groupRect', label: 'Zone' })
    const { container } = render(<DetailPanel onEdit={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  describe('Hardware section', () => {
    it('does not render hardware section when no hardware data', () => {
      setupStore({ label: 'Server' })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.queryByText('Hardware')).toBeNull()
    })

    it('renders hardware section when cpu_count is set', () => {
      setupStore({ cpu_count: 8 })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('Hardware')).toBeDefined()
      expect(screen.getByText('8')).toBeDefined()
    })

    it('renders cpu_model', () => {
      setupStore({ cpu_model: 'Intel Xeon E5-2680' })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('Intel Xeon E5-2680')).toBeDefined()
    })

    it('formats ram_gb in GB', () => {
      setupStore({ ram_gb: 32 })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('32 GB')).toBeDefined()
    })

    it('formats ram_gb >= 1024 as TB', () => {
      setupStore({ ram_gb: 2048 })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('2 TB')).toBeDefined()
    })

    it('formats disk_gb in GB', () => {
      setupStore({ disk_gb: 500 })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('500 GB')).toBeDefined()
    })

    it('formats disk_gb >= 1024 as TB', () => {
      setupStore({ disk_gb: 1536 })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('1.5 TB')).toBeDefined()
    })

    it('renders all hardware fields together', () => {
      setupStore({ cpu_count: 16, cpu_model: 'AMD EPYC', ram_gb: 128, disk_gb: 4096 })
      render(<DetailPanel onEdit={vi.fn()} />)
      expect(screen.getByText('Hardware')).toBeDefined()
      expect(screen.getByText('AMD EPYC')).toBeDefined()
      expect(screen.getByText('16')).toBeDefined()
      expect(screen.getByText('128 GB')).toBeDefined()
      expect(screen.getByText('4 TB')).toBeDefined()
    })
  })
})
