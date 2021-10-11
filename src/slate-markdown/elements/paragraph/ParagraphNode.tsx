import { defineNode, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Paragraph } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor } from 'slate'

const ParagraphNode = defineNode<Paragraph>({
  type: 'paragraph',
  isLeaf: false,
  isInline: false,
  isVoid: false,
  wrappingParagraph: false, // only for trigger; do not add block event handlers. add them in list item.
  toggle: {},
  events: {},
  render (editor: Editor, { attributes, children }: TypedRenderElementProps<Paragraph>): JSX.Element {
    return (
      <p {...attributes}>
        {children}
      </p>
    )
  },
})

export default ParagraphNode
