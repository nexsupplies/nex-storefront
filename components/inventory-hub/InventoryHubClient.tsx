'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import {
  postInventoryAdjustment,
  postInventoryReservation,
  postReleaseInventoryReservation,
  type InventoryHubMovement,
  type InventoryHubReservation,
  type InventoryHubRow,
  type InventoryHubSnapshot,
} from '@/lib/inventory-hub'

type TabKey = 'inventory' | 'movements'
type ModalState =
  | { kind: 'adjust'; row: InventoryHubRow }
  | { kind: 'reserve'; row: InventoryHubRow }
  | { kind: 'release'; row: InventoryHubRow }
  | null

function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusLabel(status: InventoryHubRow['status']) {
  switch (status) {
    case 'disabled':
      return 'Disabled'
    case 'low_stock':
      return 'Low Stock'
    case 'out_of_stock':
      return 'Out of Stock'
    default:
      return 'In Stock'
  }
}

function statusClasses(status: InventoryHubRow['status']) {
  switch (status) {
    case 'disabled':
      return 'bg-black/6 text-black/46'
    case 'low_stock':
      return 'bg-[#fff4df] text-[#9d6a00]'
    case 'out_of_stock':
      return 'bg-[#f7e7e7] text-[#a03333]'
    default:
      return 'bg-[#e8f7ec] text-[#18653b]'
  }
}

function actionLabel(actionType: string) {
  return actionType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[680px] rounded-[18px] bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <Text as="h2" variant="h2Section">
            {title}
          </Text>
          <Button
            type="button"
            variant="tertiary"
            kind="icon"
            icon={<span aria-hidden="true">x</span>}
            aria-label="Close modal"
            onClick={onClose}
          />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export default function InventoryHubClient({
  initialSnapshot,
}: {
  initialSnapshot: InventoryHubSnapshot
}) {
  const [rows, setRows] = useState(initialSnapshot.inventory)
  const [movements, setMovements] = useState(initialSnapshot.movements)
  const [tab, setTab] = useState<TabKey>('inventory')
  const [modal, setModal] = useState<ModalState>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [movementVariantFilter, setMovementVariantFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const inventoryStats = useMemo(() => {
    return {
      skuCount: rows.length,
      lowStock: rows.filter((row) => row.status === 'low_stock').length,
      outOfStock: rows.filter((row) => row.status === 'out_of_stock').length,
      reservedUnits: rows.reduce((sum, row) => sum + row.reserved, 0),
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return rows
    }

    return rows.filter((row) =>
      [row.sku, row.material, row.variant, row.location]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [rows, search])

  const rowByVariant = useMemo(() => {
    const next = new Map<string, InventoryHubRow>()

    for (const row of rows) {
      if (!next.has(row.variant_id)) {
        next.set(row.variant_id, row)
      }
    }

    return next
  }, [rows])

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase()

    return movements.filter((movement) => {
      if (movementVariantFilter && movement.variant_id !== movementVariantFilter) {
        return false
      }

      if (!query) {
        return true
      }

      const row = rowByVariant.get(movement.variant_id)

      return [
        movement.action_type,
        movement.source_type,
        movement.source_id,
        movement.operator_name,
        row?.sku,
        row?.material,
        row?.variant,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [movementVariantFilter, movements, rowByVariant, search])

  function applySnapshot(snapshot: InventoryHubSnapshot) {
    setRows(snapshot.inventory)
    setMovements(snapshot.movements)
  }

  async function handleQuickAdjust(row: InventoryHubRow, quantityChange: number) {
    setLoading(true)
    setMessage('')

    try {
      const next = await postInventoryAdjustment({
        variant_id: row.variant_id,
        location_id: row.location_id,
        quantity_change: quantityChange,
        reason: quantityChange > 0 ? 'Quick add stock' : 'Quick remove stock',
        operator_name: 'NEX Ops',
      })

      applySnapshot(next)
      setMessage(
        `${quantityChange > 0 ? 'Added' : 'Removed'} ${Math.abs(quantityChange)} unit${Math.abs(quantityChange) === 1 ? '' : 's'} for ${row.variant}.`
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAdjust(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!modal || modal.kind !== 'adjust') {
      return
    }

    const formData = new FormData(event.currentTarget)
    const quantityChange = Number(formData.get('quantity_change') || 0)
    const reason = `${formData.get('reason') || ''}`.trim()
    const operatorName = `${formData.get('operator_name') || ''}`.trim()

    setLoading(true)
    setMessage('')

    try {
      const next = await postInventoryAdjustment({
        variant_id: modal.row.variant_id,
        location_id: modal.row.location_id,
        quantity_change: quantityChange,
        reason: reason || 'Manual stock adjustment',
        operator_name: operatorName || 'NEX Ops',
      })

      applySnapshot(next)
      setModal(null)
      setMessage(`Inventory adjusted for ${modal.row.variant}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Adjustment failed.')
    } finally {
      setLoading(false)
    }
  }

  async function submitReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!modal || modal.kind !== 'reserve') {
      return
    }

    const formData = new FormData(event.currentTarget)
    const quantity = Number(formData.get('quantity') || 0)
    const sourceType = `${formData.get('source_type') || ''}`.trim()
    const sourceId = `${formData.get('source_id') || ''}`.trim()
    const note = `${formData.get('note') || ''}`.trim()
    const createdBy = `${formData.get('created_by') || ''}`.trim()

    setLoading(true)
    setMessage('')

    try {
      const next = await postInventoryReservation({
        variant_id: modal.row.variant_id,
        location_id: modal.row.location_id,
        quantity,
        source_type: sourceType || 'manual',
        source_id: sourceId || null,
        note: note || null,
        created_by: createdBy || 'NEX Ops',
      })

      applySnapshot(next)
      setModal(null)
      setMessage(`Reserved ${quantity} unit${quantity === 1 ? '' : 's'} for ${modal.row.variant}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reservation failed.')
    } finally {
      setLoading(false)
    }
  }

  async function releaseReservation(reservation: InventoryHubReservation) {
    setLoading(true)
    setMessage('')

    try {
      const next = await postReleaseInventoryReservation(reservation.id, {
        released_by: 'NEX Ops',
      })

      applySnapshot(next)
      setMessage(`Released reservation ${reservation.id}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Release failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="mx-[calc(50%-50vw)] w-screen grid grid-cols-1 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)]">
        <aside className="px-6 py-10 lg:min-h-[calc(100dvh-4rem)] lg:pl-16 lg:pr-10">
          <div className="space-y-8 lg:sticky lg:top-24">
            <div>
              <Text variant="label">Operations</Text>
              <Text as="h1" variant="h1Hero" className="mt-3">
                Inventory Hub
              </Text>
              <Text variant="bodyMd" className="mt-4 text-black/64">
                Sheet material stock, reservation, and movement control for sellable variants.
              </Text>
            </div>

            <div className="grid gap-4">
              {[
                { label: 'Rows', value: inventoryStats.skuCount },
                { label: 'Low Stock', value: inventoryStats.lowStock },
                { label: 'Out of Stock', value: inventoryStats.outOfStock },
                { label: 'Reserved Units', value: inventoryStats.reservedUnits },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[12px] bg-[#f5f5f5] px-4 py-4">
                  <Text variant="label">{stat.label}</Text>
                  <Text as="div" variant="price" className="mt-3 text-[2rem] lg:text-[2.2rem]">
                    {stat.value}
                  </Text>
                </div>
              ))}
            </div>

            <div className="rounded-[12px] bg-[#f5f5f5] px-4 py-4">
              <Text variant="label">Rules</Text>
              <Text variant="bodySm" className="mt-3">
                Available = On Hand - Reserved. Status is calculated per location row against the low stock threshold.
              </Text>
            </div>
          </div>
        </aside>

        <section className="min-w-0 border-l border-black/50 lg:col-span-2 lg:min-h-[calc(100dvh-4rem)]">
          <div className="px-6 py-10 lg:px-8 lg:pr-16">
            <div className="flex flex-col gap-4 border-b border-black/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    tab === 'inventory' ? 'bg-black text-white' : 'bg-black/[0.04] text-black/62'
                  }`}
                  onClick={() => setTab('inventory')}
                >
                  Inventory
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    tab === 'movements' ? 'bg-black text-white' : 'bg-black/[0.04] text-black/62'
                  }`}
                  onClick={() => setTab('movements')}
                >
                  Movements
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={tab === 'inventory' ? 'Search SKU, material, variant, location' : 'Search movements'}
                  className="w-full rounded-[12px] border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/35 lg:min-w-[320px]"
                />
                {tab === 'movements' && movementVariantFilter ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setMovementVariantFilter('')}
                  >
                    Clear History Filter
                  </Button>
                ) : null}
              </div>
            </div>

            {message ? (
              <div className="mt-4 rounded-[12px] bg-[#ebf9ff] px-4 py-3">
                <Text variant="bodySm" className="text-[#006a8f]">
                  {message}
                </Text>
              </div>
            ) : null}

            {tab === 'inventory' ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-[1440px] border-collapse">
                  <thead className="type-caption text-left">
                    <tr className="border-b border-black/15">
                      <th className="px-3 py-3 font-medium">SKU</th>
                      <th className="px-3 py-3 font-medium">Material</th>
                      <th className="px-3 py-3 font-medium">Variant</th>
                      <th className="px-3 py-3 font-medium">On Hand</th>
                      <th className="px-3 py-3 font-medium">Reserved</th>
                      <th className="px-3 py-3 font-medium">Available</th>
                      <th className="px-3 py-3 font-medium">Low Stock Threshold</th>
                      <th className="px-3 py-3 font-medium">Location</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Updated At</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.row_id} className="border-b border-black/10 align-top">
                        <td className="px-3 py-4">
                          <Text variant="bodySm" className="font-semibold text-black">
                            {row.sku || '—'}
                          </Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodySm">{row.material}</Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodySm">{row.variant}</Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodyMd" className="font-semibold text-black">
                            {row.on_hand}
                          </Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodyMd" className="font-semibold text-black">
                            {row.reserved}
                          </Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodyMd" className="font-semibold text-black">
                            {row.available}
                          </Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodySm">{row.low_stock_threshold}</Text>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodySm">{row.location}</Text>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium tracking-[0.08em] ${statusClasses(row.status)}`}>
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <Text variant="bodySm">{formatDate(row.updated_at)}</Text>
                        </td>
                        <td className="px-3 py-4">
                          <div className="grid gap-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleQuickAdjust(row, 10)}
                                disabled={loading || !row.location_id}
                              >
                                +10
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleQuickAdjust(row, -10)}
                                disabled={loading || !row.location_id}
                              >
                                -10
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setModal({ kind: 'adjust', row })}
                                disabled={!row.location_id}
                              >
                                Adjust
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setModal({ kind: 'reserve', row })}
                                disabled={!row.location_id || row.status === 'disabled'}
                              >
                                Reserve
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setModal({ kind: 'release', row })}
                                disabled={!row.reservations.length}
                              >
                                Release
                              </Button>
                              <Button
                                type="button"
                                variant="tertiary"
                                onClick={() => {
                                  setMovementVariantFilter(row.variant_id)
                                  setTab('movements')
                                }}
                              >
                                History
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-[1280px] border-collapse">
                  <thead className="type-caption text-left">
                    <tr className="border-b border-black/15">
                      <th className="px-3 py-3 font-medium">SKU</th>
                      <th className="px-3 py-3 font-medium">Material</th>
                      <th className="px-3 py-3 font-medium">Variant</th>
                      <th className="px-3 py-3 font-medium">Action</th>
                      <th className="px-3 py-3 font-medium">Quantity Change</th>
                      <th className="px-3 py-3 font-medium">Before</th>
                      <th className="px-3 py-3 font-medium">After</th>
                      <th className="px-3 py-3 font-medium">Source</th>
                      <th className="px-3 py-3 font-medium">Operator</th>
                      <th className="px-3 py-3 font-medium">Created At</th>
                      <th className="px-3 py-3 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((movement) => {
                      const row = rowByVariant.get(movement.variant_id)

                      return (
                        <tr key={movement.id} className="border-b border-black/10 align-top">
                          <td className="px-3 py-4">
                            <Text variant="bodySm" className="font-semibold text-black">
                              {row?.sku || '—'}
                            </Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{row?.material || 'Material'}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{row?.variant || movement.variant_id}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{actionLabel(movement.action_type)}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodyMd" className="font-semibold text-black">
                              {movement.quantity_change > 0 ? '+' : ''}
                              {movement.quantity_change}
                            </Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{movement.before_quantity}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{movement.after_quantity}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">
                              {[movement.source_type, movement.source_id].filter(Boolean).join(' / ') || '—'}
                            </Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{movement.operator_name || '—'}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{formatDate(movement.created_at)}</Text>
                          </td>
                          <td className="px-3 py-4">
                            <Text variant="bodySm">{movement.reason || '—'}</Text>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {modal?.kind === 'adjust' ? (
        <ModalShell
          title={`Adjust ${modal.row.variant}`}
          onClose={() => setModal(null)}
        >
          <form className="grid gap-4" onSubmit={submitAdjust}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2">
                <Text variant="label">Quantity Change</Text>
                <input
                  name="quantity_change"
                  type="number"
                  defaultValue={0}
                  className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
                />
              </label>
              <label className="grid gap-2">
                <Text variant="label">Operator Name</Text>
                <input
                  name="operator_name"
                  defaultValue="NEX Ops"
                  className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
                />
              </label>
            </div>
            <label className="grid gap-2">
              <Text variant="label">Reason</Text>
              <textarea
                name="reason"
                rows={3}
                defaultValue="Manual stock adjustment"
                className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                Save Adjustment
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {modal?.kind === 'reserve' ? (
        <ModalShell
          title={`Reserve ${modal.row.variant}`}
          onClose={() => setModal(null)}
        >
          <form className="grid gap-4" onSubmit={submitReservation}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2">
                <Text variant="label">Quantity</Text>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  max={Math.max(modal.row.available, 1)}
                  defaultValue={1}
                  className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
                />
              </label>
              <label className="grid gap-2">
                <Text variant="label">Created By</Text>
                <input
                  name="created_by"
                  defaultValue="NEX Ops"
                  className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
                />
              </label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2">
                <Text variant="label">Source Type</Text>
                <input
                  name="source_type"
                  defaultValue="quote"
                  className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
                />
              </label>
              <label className="grid gap-2">
                <Text variant="label">Source ID</Text>
                <input
                  name="source_id"
                  placeholder="Quote or order reference"
                  className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
                />
              </label>
            </div>
            <label className="grid gap-2">
              <Text variant="label">Note</Text>
              <textarea
                name="note"
                rows={3}
                placeholder="Optional reservation note"
                className="rounded-[12px] border border-black/15 px-4 py-3 outline-none focus:border-black/35"
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                Reserve Stock
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {modal?.kind === 'release' ? (
        <ModalShell
          title={`Release ${modal.row.variant}`}
          onClose={() => setModal(null)}
        >
          <div className="grid gap-3">
            {modal.row.reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-col gap-3 rounded-[12px] border border-black/10 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <Text variant="bodyMd" className="font-semibold text-black">
                    {reservation.source_type || 'manual'} {reservation.source_id ? `/${reservation.source_id}` : ''}
                  </Text>
                  <Text variant="bodySm" className="mt-1">
                    {reservation.quantity} reserved • {formatDate(reservation.created_at)}
                  </Text>
                  {reservation.note ? (
                    <Text variant="bodySm" className="mt-1 text-black/56">
                      {reservation.note}
                    </Text>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => releaseReservation(reservation)}
                  disabled={loading}
                >
                  Release
                </Button>
              </div>
            ))}
          </div>
        </ModalShell>
      ) : null}
    </>
  )
}
