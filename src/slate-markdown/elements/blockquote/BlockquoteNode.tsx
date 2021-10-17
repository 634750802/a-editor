import { defineNode, MdastContentType, ToolbarItemConfig } from '/src/slate-markdown/core/elements'
import { Blockquote } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, NodeEntry, Path, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import ParagraphNode from '/src/slate-markdown/elements/paragraph/ParagraphNode'

library.add(faQuoteLeft)

const toolbarItems: ToolbarItemConfig<Path>[] = [{
  key: 'blockquote',
  icon: <FontAwesomeIcon icon={faQuoteLeft} />,
  isActive: (editor: Editor, path: Path): boolean => {
    const entry: NodeEntry = [Node.get(editor, path), path]
    return !!editor.nearest(entry, BlockquoteNode)
  },
  isDisabled: (editor, path) => {
    const entry: NodeEntry = [Node.get(editor, path), path]
    const blockquoteEntry = editor.nearest(entry, BlockquoteNode)
    if (blockquoteEntry) {
      return !editor.canUnwrap(blockquoteEntry, [BlockquoteNode])
    } else {
      return !editor.canToggle(entry, BlockquoteNode, false)
    }
  },
  tips: (
    <>
      引用
    </>
  ),
  action: (editor, path, e) => {
    const entry: NodeEntry = [Node.get(editor, path), path]
    const blockquoteEntry = editor.nearest(entry, BlockquoteNode)
    if (blockquoteEntry) {
      return editor.unwrap(blockquoteEntry, [BlockquoteNode])
    } else {
      return editor.toggle(entry, BlockquoteNode, undefined)
    }
  },
}]

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
  toolbarItems,
})

export default BlockquoteNode
