import { EditorFactory } from '/src/slate-markdown/core/editor-factory'

const elements = import.meta.globEager('./**/*.tsx')
export default function (editorFactory: EditorFactory): void {
  for (const [key, { default: def, register }] of Object.entries(elements)) {
    const reg = register || def?.register
    if (typeof reg === 'function') {
      console.debug('auto detected', key)
      reg(editorFactory)
    }
  }
}
