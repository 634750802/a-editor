import { defineNode } from '/src/slate-markdown/core/elements'
import { Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { createElement } from 'react'
import { Node, Path, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'

const HeadingNode = defineNode<Heading>({
  type: 'heading',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  wrappingParagraph: false,
  render: (editor, { element, children, attributes }) => {
    return createElement(`h${element.depth}`, attributes, children)
  },
  toggle: {
    prefix: /^#{1,6}$/,
    estimatePrefixLength: 6,
    toggle: (editor, path, params) => {
      if (params) {
        Transforms.setNodes(editor, { type: 'heading', ...params }, { at: path })
      } else {
        Transforms.unsetNodes(editor, 'depth', { at: path })
        Transforms.setNodes(editor, { type: 'paragraph' }, { at: path })
      }
    },
    onTrigger: (prefix) => {
      return { depth: prefix.length as Heading['depth'] }
    },
  },
  events: {
    onStartDelete: (editor, path) => {
      const heading = Node.parent(editor, path)
      if (!isElementType<Heading>(heading, 'heading')) {
        return false
      }
      if (heading.depth > 1) {
        HeadingNode.toggle.toggle(editor, Path.parent(path), { depth: heading.depth - 1 as never })
      } else {
        HeadingNode.toggle.toggle(editor, Path.parent(path), false)
      }
      return true
    },
    onStartEnter: (editor, path) => {
      const heading = Node.parent(editor, path)
      if (!isElementType<Heading>(heading, 'heading')) {
        return false
      }
      HeadingNode.toggle.toggle(editor, Path.parent(path), false)
      return true
    },
    onTab: (editor, path) => {
      const heading = Node.parent(editor, path)
      if (!isElementType<Heading>(heading, 'heading')) {
        return false
      }
      if (heading.depth < 6) {
        HeadingNode.toggle.toggle(editor, Path.parent(path), { depth: heading.depth + 1 as never })
      }
      return true
    }
  },
})

export default HeadingNode
