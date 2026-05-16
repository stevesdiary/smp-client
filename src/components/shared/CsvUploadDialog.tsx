import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

interface CsvUploadDialogProps {
  title: string
  uploadUrl: string
  templateUrl: string
  templateFileName: string
  invalidateKeys: string[][]
  trigger?: React.ReactNode
}

export function CsvUploadDialog({
  title,
  uploadUrl,
  templateUrl,
  templateFileName,
  invalidateKeys,
  trigger,
}: CsvUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const qc = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      const fd = new FormData()
      fd.append('file', file)
      return api.post(uploadUrl, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (res) => {
      const data = res.data
      const imported = data.imported ?? 0
      const errors = data.errors ?? []
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      if (errors.length > 0) {
        toast.warning(`Imported ${imported} records with ${errors.length} warnings`, {
          description: errors.slice(0, 3).join('\n'),
          duration: 8000,
        })
      } else {
        toast.success(`Imported ${imported} records successfully`)
      }
      setOpen(false)
      setFile(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Upload failed'
      const details = err.response?.data?.details
      toast.error(msg, details ? { description: details.slice(0, 3).join('\n') } : undefined)
    },
  })

  async function downloadTemplate() {
    try {
      const res = await api.get(templateUrl, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = templateFileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Template downloaded')
    } catch {
      toast.error('Failed to download template')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFile(null) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="h-10 rounded-xl">
            <Upload className="mr-2 h-4 w-4" />CSV Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-xl max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1: Download template */}
          <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Step 1: Download template</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get a pre-filled CSV with your current students. Fill in the data and upload it back.
                </p>
                <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={downloadTemplate}>
                  <Download className="mr-2 h-3.5 w-3.5" />Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Step 2: Upload filled CSV</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              className="h-11 rounded-2xl"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            className="h-11 w-full rounded-2xl"
            disabled={!file || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload & Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
