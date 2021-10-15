import { defineNode } from '/src/slate-markdown/core/elements'
import { Blockquote } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Path, Transforms } from 'slate'
import { hasAncestor, isElementType } from '/src/slate-markdown/slate-utils'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faQuoteLeft)

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
    },
  },
  toolbarItems: [{
    key: 'blockquote',
    icon: <FontAwesomeIcon icon={faQuoteLeft} />,
    isActive: isBlockquoteActive,
    isDisabled: (editor, range) => !isElementType(Node.get(editor, range), ['heading', 'paragraph']),
    tips: <>
      引用
          </>,
    action: (editor, range, e) => {
      if (isBlockquoteActive(editor, range)) {
        BlockquoteNode.toggle.toggle(editor, range, false)
      } else {
        BlockquoteNode.toggle.toggle(editor, range, true)
      }
    },
  }],
})

export function isBlockquoteActive (editor: Editor, path: Path): boolean {
  return hasAncestor(editor, { at: path, match: node => isElementType(node, 'blockquote') })
}

export default BlockquoteNode
