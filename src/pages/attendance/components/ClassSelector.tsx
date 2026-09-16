import { useQuery } from '@tanstack/react-query'
import { CheckCheck } from 'lucide-react'
import api from '@/lib/api'
import { Class } from '@/types'
import { SearchSelect } from '@/components/ui/search-select'
import { Label } from '@/components/ui/label'

interface ClassSelectorProps {
  selectedClassId: string | null
  selectedDate: string
  onClassSelect: (classId: string) => void
  onDateChange: (date: string) => void
  onMarkAllPresent?: () => void
}

export default function ClassSelector({
  selectedClassId,
  selectedDate,
  onClassSelect,
  onDateChange,
  onMarkAllPresent,
}: ClassSelectorProps) {
  const { data: classes = [], isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes')
      return response.data as Class[]
    },
  })

  if (error) {
    return (
      <div className="rounded-3xl bg-[#ffdad6]/40 p-4 text-sm font-medium text-[#93000a]">
        Failed to load classes. Please try again.
      </div>
    )
  }

  return (
    <section className="rounded-3xl bg-surface-container-low p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px]">
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Class</Label>
            <SearchSelect
              value={selectedClassId || ''}
              onChange={onClassSelect}
              options={classes.map((cls) => ({ id: cls.id, label: cls.name, sub: `${cls._count?.enrollments || 0} students` }))}
              placeholder={isLoading ? 'Loading classes…' : 'Choose a class'}
              searchPlaceholder="Search classes…"
              emptyText="No classes"
            />
          </div>

          <div className="min-w-[180px]">
            <Label htmlFor="date-input" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Date
            </Label>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
            />
          </div>

          {selectedClassId && (
            <button
              onClick={() => onClassSelect('')}
              className="h-11 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Clear
            </button>
          )}
        </div>

        {onMarkAllPresent && (
          <button
            onClick={onMarkAllPresent}
            className="flex h-11 items-center gap-2 rounded-xl bg-primary-fixed px-5 text-sm font-bold text-primary-container transition-colors hover:bg-primary-fixed-dim"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.5} /> Mark All Present
          </button>
        )}
      </div>
    </section>
  )
}
