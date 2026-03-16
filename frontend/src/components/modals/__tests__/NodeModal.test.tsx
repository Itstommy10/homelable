import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeModal } from '../NodeModal'

describe('NodeModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <NodeModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders form fields when open', () => {
    render(<NodeModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByPlaceholderText('My Server')).toBeDefined()
    expect(screen.getByText('Add Node')).toBeDefined()
  })

  it('does not call onSubmit when label is empty and shows error', () => {
    const onSubmit = vi.fn()
    render(<NodeModal open onClose={vi.fn()} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Add'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Label is required')).toBeDefined()
  })

  it('calls onSubmit with form data when label is filled', () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(<NodeModal open onClose={onClose} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('My Server'), { target: { value: 'My NAS' } })
    fireEvent.click(screen.getByText('Add'))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][0].label).toBe('My NAS')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('clears label error when user starts typing', () => {
    render(<NodeModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText('Label is required')).toBeDefined()
    fireEvent.change(screen.getByPlaceholderText('My Server'), { target: { value: 'x' } })
    expect(screen.queryByText('Label is required')).toBeNull()
  })

  it('pre-fills form from initial prop', () => {
    render(
      <NodeModal open onClose={vi.fn()} onSubmit={vi.fn()} initial={{ label: 'Pre-filled', ip: '10.0.0.1' }} />
    )
    const input = screen.getByPlaceholderText('My Server') as HTMLInputElement
    expect(input.value).toBe('Pre-filled')
  })

  it('shows Save button text when title is Edit Node', () => {
    render(<NodeModal open onClose={vi.fn()} onSubmit={vi.fn()} title="Edit Node" />)
    expect(screen.getByText('Save')).toBeDefined()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<NodeModal open onClose={onClose} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
