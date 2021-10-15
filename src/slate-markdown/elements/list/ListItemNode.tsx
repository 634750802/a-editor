import { defineNode } from '/src/slate-markdown/core/elements'
import { List, ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Path, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import ListNode, { indentList, toggleList } from '/src/slate-markdown/elements/list/ListNode'
import React from 'react'

const ListItemNode = defineNode<ListItem>({
  type: 'listItem',
  isLeaf: false,
  isInline: false,
  isVoid: false,
  wrappingParagraph: true, // only for block event handlers; do not add trigger. add them in list item.
  normalize: (editor, node, path) => {
    const lastIndex = node.children.length - 1
    if (node.children.length > 1 && isElementType(node.children[lastIndex], 'paragraph')) {
      const newPath = Path.next(path)
      Transforms.moveNodes(editor, { at: path.concat(lastIndex), to: newPath })
      Transforms.wrapNodes(editor, { type: 'listItem', checked: node.checked, spread: node.spread, children: [] }, { at: newPath })
    }
  },
  render (editor: Editor, { element, attributes, children }): JSX.Element {
    return (
      <li {...attributes}>
        {children}
      </li>
    )
  },
  toggle: {},
  events: {
    onStartDelete: (editor, path) => {
      toggleList(editor, Path.parent(path), false)
      return true
    },
    onStartEnter: (editor, path) => {
      if (!Node.string(Node.get(editor, path))) {
        toggleList(editor, Path.parent(path), false)
        return true
      } else {
        return false
      }
    },
    onTab: (editor, path) => {
      const grandParent = Node.parent(editor, Path.parent(Path.parent(path)))
      if (isElementType<List>(grandParent, 'list')) {
        indentList(editor, Path.parent(path), 1)
        return true
      } else {
        console.warn(`bad structure, expect a list at ${path}-2`)
        return false
      }
    },
  },
  toolbarItems: []
})

export default ListItemNode
