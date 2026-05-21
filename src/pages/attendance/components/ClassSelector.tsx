import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Class } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface ClassSelectorProps {
  selectedClassId: string | null
  selectedDate: string
  onClassSelect: (classId: string) => void
  onDateChange: (date: string) => void
}

export default function ClassSelector({
  selectedClassId,
  selectedDate,
  onClassSelect,
  onDateChange,
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
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">Failed to load classes. Please try again.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-slate-50 border-slate-200">
      <div className="flex gap-6 items-end">
        {/* Class Selector */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="class-select" className="block text-sm font-medium mb-2 text-slate-700">
            Select Class
          </Label>
          <Select value={selectedClassId || ''} onValueChange={onClassSelect} disabled={isLoading}>
            <SelectTrigger id="class-select" className="w-full">
              <SelectValue placeholder={isLoading ? 'Loading classes...' : 'Choose a class'} />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls._count?.enrollments || 0} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="date-input" className="block text-sm font-medium mb-2 text-slate-700">
            Date
          </Label>
          <Input
            id="date-input"
            type="date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Clear selection button */}
        {selectedClassId && (
          <Button
            variant="outline"
            onClick={() => onClassSelect('')}
            className="px-4"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Help text */}
      {selectedClassId && (
        <p className="text-xs text-slate-600 mt-3">
          Class selected. Scroll down to mark attendance for each student.
        </p>
      )}
    </Card>
  )
}
