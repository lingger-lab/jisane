'use client'

import { useRef, useState } from 'react'
import { createClient } from '@jisane/shared/supabase/client'
import { ServiceBanner } from './service-banner'
import { cn } from '../lib/cn'

/**
 * 배너 업로더 — 파일 선택 → 16:9 center-crop → WebP(0.85) → 서버발급 signed URL로 업로드 →
 * public URL을 hidden input(name)에 담아 폼과 함께 제출. Storage 미구성/실패 시 배너 없이 계속.
 * requestUpload는 앱별 서버액션(가드 포함)을 DI로 받아 UI 패키지가 서버에 직접 의존하지 않는다.
 */

interface UploadTarget {
  bucket: string
  path: string
  token: string
  publicUrl: string
}

async function cropToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const W = 1280
  const H = 720
  const dstRatio = W / H
  const srcRatio = bitmap.width / bitmap.height
  let sx = 0
  let sy = 0
  let sw = bitmap.width
  let sh = bitmap.height
  if (srcRatio > dstRatio) {
    sw = bitmap.height * dstRatio
    sx = (bitmap.width - sw) / 2
  } else {
    sh = bitmap.width / dstRatio
    sy = (bitmap.height - sh) / 2
  }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 얻지 못했습니다.')
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, W, H)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob 실패'))), 'image/webp', 0.85),
  )
}

export function BannerUploader({
  name = 'banner_url',
  defaultValue = null,
  requestUpload,
  tone = 'primary',
}: {
  name?: string
  defaultValue?: string | null
  /** 앱별 서버액션 — 가드 후 signed upload URL 발급. Storage 미구성 시 null */
  requestUpload: () => Promise<UploadTarget | null>
  tone?: 'primary' | 'accent' | 'partner'
}) {
  const [value, setValue] = useState<string | null>(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accent =
    tone === 'accent' ? 'text-accent' : tone === 'partner' ? 'text-partner' : 'text-primary'

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('이미지는 8MB 이하로 올려주세요.')
      return
    }
    setBusy(true)
    try {
      const blob = await cropToWebp(file)
      const target = await requestUpload()
      if (!target) {
        setError('배너 저장소가 아직 준비되지 않았어요 — 배너 없이 저장할 수 있어요.')
        return
      }
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, blob, { contentType: 'image/webp' })
      if (upErr) {
        setError('업로드에 실패했어요. 잠시 후 다시 시도해주세요.')
        return
      }
      setValue(`${target.publicUrl}?v=${Date.now()}`) // 캐시 무효화
    } catch {
      setError('이미지 처리 중 문제가 발생했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={value ?? ''} />
      <div className="max-w-sm">
        <ServiceBanner src={value} alt="서비스 배너 미리보기" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            'focus-ring inline-flex items-center rounded-lg border border-border-light px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50',
            accent,
          )}
        >
          {busy ? '올리는 중…' : value ? '배너 변경' : '배너 올리기'}
        </button>
        {value && !busy && (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="focus-ring inline-flex items-center rounded-lg px-2 py-1.5 text-xs text-text-subtle transition-colors hover:text-text"
          >
            제거
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      <p className="text-xs text-text-subtle">권장 16:9 · 자동으로 잘라 최적화됩니다(WebP).</p>
      {error && (
        <p className="text-xs text-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}
