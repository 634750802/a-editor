import { defineNode, MdastContentType, ToolbarItemConfig } from '/src/slate-markdown/core/elements'
import { ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, NodeEntry, Path, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import ListNode from '/src/slate-markdown/elements/list/ListNode'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIndent, faOutdent } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faIndent, faOutdent)

const toolbarItems: ToolbarItemConfig<Path>[] = [
  {
    key: 'indent-list-item',
    isActive: () => false,
    isDisabled: (editor, path) => {
      const nearestList = editor.nearest([Node.get(editor, path), path], ListNode)
      return !nearestList || nearestList[0].children.length <= 1
    },
    icon: <FontAwesomeIcon icon={faIndent} />,
    action: (editor, path, event) => {
      // TODO: this is dirty
      const ordered: boolean | undefined = editor.getAndRemoveMark('ordered') as never
      const start: number | undefined = editor.getAndRemoveMark('start') as never

      const entry: NodeEntry = [Node.get(editor, path), path]
      const nearestList = editor.nearest(entry, ListNode)
      if (!nearestList || nearestList[0].children.length <= 1) {
        return
      }
      const nearestListItemEntry = editor.nearest(entry, ListItemNode)
      if (!nearestListItemEntry || !Path.hasPrevious(nearestListItemEntry[1])) {
        return
      }
      if (editor.wrap(nearestListItemEntry, [ListItemNode, ListNode], [{ spread: undefined, checked: undefined }, { ordered: ordered ?? nearestList[0].ordered, spread: undefined, start }])) {
        Transforms.mergeNodes(editor, { at: nearestListItemEntry[1] })
      }
    },
  },
  {
    key: 'outdent-list-item',
    isActive: () => false,
    isDisabled: (editor, path) => {
      const nearestList = editor.nearest([Node.get(editor, path), path], ListNode)
      return !nearestList
    },
    icon: <FontAwesomeIcon icon={faOutdent} />,
    action: (editor, path, event) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const nearestList = editor.nearest(entry, ListNode)
      if (!nearestList) {
        return
      }
      const nearestListItemEntry = editor.nearest(entry, ListItemNode)
      if (!nearestListItemEntry) {
        return
      }
      const pathRef = Editor.pathRef(editor, nearestListItemEntry[1])
      const nextLiPath = Path.next(nearestListItemEntry[1])

      if (Editor.hasPath(editor, nextLiPath)) {
        Transforms.splitNodes(editor, { at: nextLiPath })
      }

      Transforms.splitNodes(editor, { at: nearestListItemEntry[1] })
      if (pathRef.current) {
        const listPath = Path.parent(pathRef.current)
        const newListEntry: NodeEntry = [Node.get(editor, listPath), listPath]
        editor.unwrap(newListEntry, [ListNode, ListItemNode])
        Transforms.splitNodes(editor, { at: listPath })
      }
      pathRef.unref()
    },
  },
]

const ListItemNode = defineNode<ListItem>({
  type: 'listItem',
  isLeaf: false,
  isInline: false,
  isVoid: false,
  wrappingParagraph: true, // only for block event handlers; do not add trigger. add them in list item.
  contentType: MdastContentType.list,
  contentModelType: MdastContentType.flow,
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
      toolbarItems[1].action(editor, Path.parent(path), {} as never)
      return true
    },
    onStartEnter: (editor, path) => {
      if (!Node.string(Node.get(editor, path))) {
        toolbarItems[1].action(editor, Path.parent(path), {} as never)
        return true
      } else {
        return false
      }
    },
    onTab: (editor, path) => {
      toolbarItems[0].action(editor, Path.parent(path), {} as never)
      return true
    },
  },
  toolbarItems,
})

export default ListItemNode
