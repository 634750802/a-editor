import { defineNode, MdastContentType } from '../../core/elements'
import { Blockquote } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Node, Path } from 'slate'
import { isElementType } from '../../slate-utils'
import React from 'react'
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faQuoteLeft)

const BlockquoteNode = defineNode<Blockquote>({
  type: 'blockquote',
  isInline: false,
  isLeaf: false,
  wrappingParagraph: true,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.flow,
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
        return editor.runAction('indent-blockquote', path)
      }
      return false
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
      return editor.runAction('outdent-blockquote', Path.parent(path))
    },
  },
})

export default BlockquoteNode
