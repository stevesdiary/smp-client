import { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export type SearchOption = { id: string; label: string; sub?: string }

/**
 * A searchable single-select that expands inline (so it never clips inside a
 * scrollable dialog). Filters options by label + sub as you type.
 */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches',
}: {
  value?: string
  onChange: (id: string) => void
  options: SearchOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = options.find((o) => o.id === value)
  const ql = q.trim().toLowerCase()
  const filtered = ql ? options.filter((o) => `${o.label} ${o.sub ?? ''}`.toLowerCase().includes(ql)) : options

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <span className={selected ? 'truncate text-on-surface' : 'text-muted-foreground'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-outline transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="border-t border-outline-variant/20">
          <div className="relative p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-outline" strokeWidth={1.5} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low pl-9 pr-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-52 overflow-y-auto px-1 pb-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false); setQ('') }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-container-low ${
                    o.id === value ? 'bg-surface-container-low font-bold text-primary' : 'text-on-surface'
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {o.label}
                    {o.sub && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{o.sub}</span>}
                  </span>
                  {o.id === value && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
