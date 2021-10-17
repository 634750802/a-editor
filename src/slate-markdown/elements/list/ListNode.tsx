import { defineNode, MdastContentType, RemarkElementProps, RemarkElementToggleParams, ToolbarItemConfig, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { List, ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, NodeEntry, Path, Transforms } from 'slate'
import { isElementType, previousSiblingLastChildPath } from '/src/slate-markdown/slate-utils'
import React from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faListOl, faListUl } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ListItemNode from '/src/slate-markdown/elements/list/ListItemNode'

library.add(faListOl, faListUl)


const toolbarItems: ToolbarItemConfig<Path>[] = [true, false].map(ordered => {
  const listParam: RemarkElementProps<List> = { ordered, spread: undefined, start: undefined }
  const listItemParam: RemarkElementProps<ListItem> = { spread: undefined, checked: undefined }
  return {
    key: `list-${ordered ? 'ordered' : 'unordered'}`,
    // eslint-disable-next-line react/jsx-one-expression-per-line
    icon: <FontAwesomeIcon icon={ordered ? faListOl : faListUl} />,
    isActive: (editor: Editor, path: Path): boolean => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const nearestList = editor.nearest(entry, ListNode)
      return nearestList ? (Boolean(nearestList[0].ordered) === Boolean(ordered)) : false
    },
    isDisabled: (editor, path) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const nearest = editor.nearest(entry, ListNode)
      if (nearest) {
        return !editor.canUnwrap(nearest, [ListNode, ListItemNode])
      } else {
        return !editor.canWrap(entry, [ListNode, ListItemNode], [listParam, listItemParam])
      }
    },
    action: (editor, path, event) => {
      // TODO: this is dirty
      const start: number | undefined = editor.getAndRemoveMark('start') as never
      const entry: NodeEntry = [Node.get(editor, path), path]
      const nearest = editor.nearest(entry, ListNode)
      if (nearest) {
        const [list, path] = nearest
        if (list.ordered === ordered) {
          editor.unwrap(nearest, [ListNode, ListItemNode])
        } else {
          Transforms.setNodes(editor, { ordered, start }, { at: path })
        }
      } else {
        editor.wrap(entry, [ListNode, ListItemNode], [Object.assign({}, listParam, { start }), listItemParam])
      }
    },
  }
})

const ListNode = defineNode<List>({
  type: 'list',
  isLeaf: false,
  isInline: false,
  isVoid: false,
  wrappingParagraph: true, // only for trigger; do not add block event handlers. add them in list item.
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.list,
  normalize: (editor, node, path, preventDefaults) => {
    if (node.children.length === 0) {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
      return
    }
    if (Path.hasPrevious(path)) {
      const prev = Node.get(editor, Path.previous(path))
      if (isElementType<List>(prev, 'list')) {
        if (Boolean(prev.ordered) === Boolean(node.ordered) && prev.start === undefined && node.start === undefined) {
          Transforms.mergeNodes(editor, { at: path })
          preventDefaults()
          return
        }
      }
    }
  },
  render (editor: Editor, { element, attributes, children }: TypedRenderElementProps<List>): JSX.Element {
    if (element.ordered) {
      return (
        <ol
          {...attributes}
          start={element.start}
        >
          {children}
        </ol>
      )
    } else {
      return (
        <ul {...attributes}>
          {children}
        </ul>
      )
    }
  },
  toggle: {
    prefix: /^(?:-|\d+\.)$/,
    toggle: toggleList,
    onTrigger: (prefix: string): RemarkElementToggleParams<List> | undefined => {
      if (prefix === '-') {
        return {
          ordered: false,
          start: undefined,
          spread: undefined,
        }
      } else {
        const start = parseInt(prefix)
        return {
          ordered: true,
          start: start === 1 ? undefined : start,
          spread: undefined,
        }
      }
    },
  },
  events: {},
  toolbarItems,
})

export function toggleList (editor: Editor, path: Path, params: RemarkElementToggleParams<List>): void {
  // node must be paragraph
  if (params === false) {
    throw new Error('should never reach')
  } else {
    // TODO: this is dirty
    editor.addMark('start', params.start)
    if (editor.nearest([Node.get(editor, path), path], ListNode)) {
      editor.addMark('ordered', params.ordered)
      ListItemNode.toolbarItems[0].action(editor, path, {} as never)
    } else {
      toolbarItems[params.ordered ? 0 : 1].action(editor, path, {} as never)
    }
  }
}

export default ListNode
