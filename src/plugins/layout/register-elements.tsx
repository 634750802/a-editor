import { CustomBlockElements, defineNode, MdastContentType } from '@/slate-markdown/core/elements'
import { Descendant, Editor, Transforms } from 'slate'

declare module '../../slate-markdown/core/elements' {
  export interface CustomBlockElements {
    section: {
      type: 'section'
      children: Descendant[]
    }
  }
}

export default defineNode<CustomBlockElements['section']>({
  type: 'section',
  isLeaf: false,
  isInline: false,
  isEditable: false,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.flow,
  wrappingParagraph: false,
  normalize: (editor, node, path, preventDefaults) => {
    if (node.children.length === 0) {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
    }
  },
  render (editor: Editor, { attributes, children }): JSX.Element {
    return (
      <section {...attributes}>
        {children}
      </section>
    )
  },
  events: {},
  toggle: {},
})
