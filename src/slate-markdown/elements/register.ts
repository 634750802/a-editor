import { EditorFactory } from '/src/slate-markdown/core/editor-factory'

const elements = import.meta.globEager('./**/*.tsx')
export default function (editorFactory: EditorFactory): void {
  for (const [key, { default: def }] of Object.entries(elements)) {
    if (typeof def?.register === 'function') {
      console.debug('auto detected', key)
      def.register(editorFactory)
    }
  }
}
