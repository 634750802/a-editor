import { Editor, Element, NodeEntry, Path, Range } from 'slate'
import { ICustomBlockElementConfig, RemarkBlockElement, RemarkInlineElement, RemarkText } from '@/slate-markdown/core/elements'
import { EditorFactory } from '@/slate-markdown/core/editor-factory'

type RequiredProp<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type Frame<T extends RemarkBlockElement> = {
  element: Element
  path: Path
  config: RequiredProp<ICustomBlockElementConfig<T>, 'decorate'>
}

export default class DecorationStack<A extends RemarkText, B extends RemarkBlockElement, C extends RemarkInlineElement> {
  state: Frame<never>[] = []

  constructor (private readonly factory: EditorFactory<A, B, C>, private readonly editor: Editor) {
  }

  process (entry: NodeEntry): Range[] {
    const [node, path] = entry
    if (Editor.isEditor(node)) {
      this.state = []
      return []
    }
    if (Element.isElement(node)) {
      const config = this.factory.customElementMap.get(node.type)
      if (config && !config.isInline) {
        const blockConfig = config as ICustomBlockElementConfig<never>
        if (blockConfig.decorate) {
          this.state.push({
            element: node,
            path,
            config: blockConfig as RequiredProp<ICustomBlockElementConfig<never>, 'decorate'>,
          })
          return []
        }
      }
    }
    if (this.state.length > 0) {
      for (const frame of this.state.reverse()) {
        if (Path.isAncestor(frame.path, path)) {
          // do we need nesting decoration?
          return frame.config.decorate(this.editor, entry, frame.element as never)
        }
      }
    }
    return []
  }
}
