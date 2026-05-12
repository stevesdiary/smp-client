import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Download, Maximize2, Minimize2,
  Minus, Plus, X, ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { EBook, ReadingProgress } from '@/types'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface EBookReaderProps {
  ebook: EBook
  onClose: () => void
}

const ZOOM_STEP = 0.15
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const SAVE_DEBOUNCE_MS = 2000

export function EBookReader({ ebook, onClose }: EBookReaderProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageInput, setPageInput] = useState('1')
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { data: readUrl } = useQuery({
    queryKey: ['ebook-read', ebook.id],
    queryFn: () => api.get(`/library/ebooks/${ebook.id}/read`).then((r) => r.data as { url: string; fileType: string }),
  })

  const { data: progress } = useQuery({
    queryKey: ['ebook-progress', ebook.id],
    queryFn: () => api.get(`/library/ebooks/${ebook.id}/progress`).then((r) => r.data as ReadingProgress),
  })

  const saveMutation = useMutation({
    mutationFn: (data: { currentPage: number; totalPages?: number }) =>
      api.post(`/library/ebooks/${ebook.id}/progress`, data),
  })

  useEffect(() => {
    if (progress?.currentPage && progress.currentPage > 1) {
      setCurrentPage(progress.currentPage)
      setPageInput(String(progress.currentPage))
    }
  }, [progress])

  const debouncedSave = useCallback(
    (page: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveMutation.mutate({ currentPage: page, totalPages: numPages || undefined })
      }, SAVE_DEBOUNCE_MS)
    },
    [numPages, saveMutation]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  function onDocumentLoadSuccess({ numPages: total }: { numPages: number }) {
    setNumPages(total)
  }

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, numPages))
    setCurrentPage(clamped)
    setPageInput(String(clamped))
    debouncedSave(clamped)
  }

  function handlePageInputSubmit() {
    const parsed = parseInt(pageInput, 10)
    if (!isNaN(parsed)) goToPage(parsed)
  }

  function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToPage(currentPage + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPage(currentPage - 1) }
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + ZOOM_STEP, MAX_ZOOM))
      if (e.key === '-') setScale((s) => Math.max(s - ZOOM_STEP, MIN_ZOOM))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleDownload() {
    try {
      const { data } = await api.get(`/library/ebooks/${ebook.id}/download`)
      const link = document.createElement('a')
      link.href = data.url
      link.download = data.fileName
      link.target = '_blank'
      link.click()
    } catch { /* ignore */ }
  }

  const pct = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-stone-900"
    >
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-stone-950 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white truncate max-w-[300px]">{ebook.title}</p>
            <p className="text-xs text-white/50">{ebook.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setScale((s) => Math.max(s - ZOOM_STEP, MIN_ZOOM))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-xs text-white/70">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setScale((s) => Math.min(s + ZOOM_STEP, MAX_ZOOM))}>
            <Plus className="h-4 w-4" />
          </Button>
          <div className="mx-2 h-5 w-px bg-white/20" />
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {ebook.isDownloadable && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Document area */}
      <div className="relative flex-1 overflow-auto flex items-start justify-center py-6">
        {!readUrl ? (
          <div className="flex flex-col items-center gap-4 pt-20">
            <Skeleton className="h-[600px] w-[450px] rounded-lg bg-white/10" />
          </div>
        ) : (
          <Document
            file={readUrl.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Skeleton className="h-[600px] w-[450px] rounded-lg bg-white/10" />}
            error={<p className="text-red-400 pt-20">Failed to load document.</p>}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              className="shadow-2xl shadow-black/50"
              loading={<Skeleton className="h-[600px] w-[450px] rounded-lg bg-white/10" />}
            />
          </Document>
        )}

        {/* Side navigation arrows */}
        {numPages > 1 && (
          <>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60 disabled:opacity-20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60 disabled:opacity-20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-between border-t border-white/10 bg-stone-950 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Page</span>
          <Input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
            onBlur={handlePageInputSubmit}
            className="h-7 w-14 rounded-lg border-white/20 bg-white/10 text-center text-xs text-white"
          />
          <span className="text-xs text-white/50">of {numPages || '...'}</span>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md mx-6">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-white/50">{pct}%</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
