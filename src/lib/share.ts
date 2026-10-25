/** Sharing helpers for the milestone card. Everything runs in the browser; nothing is uploaded. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function renderPng(node: HTMLElement, scale = 2): Promise<Blob> {
  const { domToBlob } = await import('modern-screenshot')
  await document.fonts?.ready
  return domToBlob(node, { scale, type: 'image/png', backgroundColor: '#f5f1e8' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function nativeShare(text: string, png: Blob | null): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!navigator.share) return 'unsupported'
  try {
    const file = png ? new File([png], 'milestone.png', { type: 'image/png' }) : null
    if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ text, files: [file] })
    else await navigator.share({ text })
    return 'shared'
  } catch (e) {
    return (e as Error)?.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

/** A generic invitation. It never mentions the user's goal, habits or records. */
export function inviteText(origin: string): string {
  return `I am trying Tarn, a quiet daily check in app with no account. Want to do a week alongside me? ${origin}/`
}
