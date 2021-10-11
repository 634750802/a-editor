import { defineNode } from '/src/slate-markdown/core/elements'
import { Blockquote, Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Node, Path, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'

const BlockquoteNode = defineNode<Blockquote>({
  type: 'blockquote',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  wrappingParagraph: true,
  render: (editor, { children, attributes }) => {
    return (
      <blockquote {...attributes}>
        {children}
      </blockquote>
    )
  },
  toggle: {
    prefix: /^>$/,
    toggle: (editor, path, params) => {
      if (params) {
        Transforms.wrapNodes(editor, { type: 'blockquote', children: [] }, { at: path })
      } else {
        Transforms.unwrapNodes(editor, { at: Path.parent(path) })
      }
    },
    onTrigger () {
      return true
    }
  },
  events: {
    onStartDelete: (editor, path) => {
      const blockquote = Node.parent(editor, Path.parent(path))
      if (!isElementType<Blockquote>(blockquote, 'blockquote')) {
        return false
      }
      BlockquoteNode.toggle.toggle(editor, Path.parent(path), false)
      return true
    }
  },
})

export default BlockquoteNode
