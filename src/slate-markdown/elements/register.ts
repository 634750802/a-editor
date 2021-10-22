import { EditorFactory } from '@/slate-markdown/core/editor-factory'

const elements = import.meta.globEager('./**/*.tsx')
export default function coreRemarkElements (editorFactory: EditorFactory): void {
  const keys: string[] = []
  for (const [key, { default: def, register }] of Object.entries(elements)) {
    const reg = register || def?.register
    if (typeof reg === 'function') {
      keys.push(key)
      reg(editorFactory)
    }
  }
  console.debug('auto detected', keys)
}
