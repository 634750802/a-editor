import { defineNode, MdastContentType } from '@/slate-markdown/core/elements'
import { ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Path, Transforms } from 'slate'
import { isElementType } from '@/slate-markdown/slate-utils'
import React from 'react'
import { faIndent, faOutdent } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import ListNode from '@/slate-markdown/elements/list/ListNode'

library.add(faIndent, faOutdent)

const ListItemNode = defineNode<ListItem>({
  type: 'listItem',
  isLeaf: false,
  isInline: false,
  wrappingParagraph: true, // only for block event handlers; do not add trigger. add them in list item.
  contentType: MdastContentType.list,
  contentModelType: MdastContentType.flow,
  normalize: (editor, node, path, preventDefaults) => {
    if (node.children.length > 0) {
      if (isElementType(node.children[0], 'list')) {
        Transforms.moveNodes(editor, { at: path.concat(0), to: Path.parent(path) })
        preventDefaults()
        return
      } else {
        const lastIndex = node.children.length - 1
        if (node.children.length > 1 && isElementType(node.children[lastIndex], 'paragraph')) {
          const newPath = Path.next(path)
          Transforms.moveNodes(editor, { at: path.concat(lastIndex), to: newPath })
          Transforms.wrapNodes(editor, { type: 'listItem', checked: node.checked, spread: node.spread, children: [] }, { at: newPath })
          preventDefaults()
          return
        }
        if (node.children.length >= 1 && !isElementType(node.children[0], 'paragraph')) {
          const parent = Node.parent(editor, path)
          if (editor.unwrap([parent, Path.parent(path)], [ListNode, ListItemNode])) {
            preventDefaults()
            return
          }
        }
      }
    } else {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
      return
    }
    const parent = Node.parent(editor, path)
    const parentContentModelType = editor.getContentModelType(parent)
    if (parentContentModelType !== MdastContentType.list) {
      Transforms.wrapNodes(editor, { type: 'list', ordered: false, start: undefined, spread: undefined, children: [] }, { at: path })
      preventDefaults()
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
      return editor.runAction('outdent-list', Path.parent(path))
    },
    onStartEnter: (editor, path) => {
      if (!Node.string(Node.get(editor, path))) {
        return editor.runAction('outdent-list', Path.parent(path))
      } else {
        return false
      }
    },
    onTab: (editor, path) => {
      return editor.runAction('indent-list', Path.parent(path))
    },
  },
})

export default ListItemNode
