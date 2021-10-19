import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import { ActionType } from '/src/slate-markdown/core/actions'
import { Editor, Node, NodeEntry, Path, Transforms } from 'slate'
import { List, ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import ListNode from '/src/slate-markdown/elements/list/ListNode'
import ListItemNode from '/src/slate-markdown/elements/list/ListItemNode'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faIndent, faListOl, faListUl, faOutdent } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { RemarkElementProps } from '/src/slate-markdown/core/elements'

type ListIndentionActionProps = {
  listEntry: NodeEntry<List> | undefined
  listItemEntry: NodeEntry<ListItem> | undefined
  ordered?: boolean
  start?: number
}

type ListToggleActionProps = {
  listEntry: NodeEntry<List> | undefined

}

const getActionParams = (editor: Editor) => {
  let ordered: boolean | undefined
  let start: number | undefined

  if (editor.runActionParams && typeof editor.runActionParams === 'object') {
    const { ordered: _ordered, start: _start } = editor.runActionParams as Record<string, unknown>
    if (typeof _ordered === 'boolean') {
      ordered = _ordered
    }
    if (typeof _start === 'number') {
      start = _start
    }
  }
  return { ordered, start }
}

export function register (factory: EditorFactory): void {
  factory.defineAction<ActionType.phrasing, ListIndentionActionProps>({
    key: 'indent-list',
    type: ActionType.phrasing,
    icon: <FontAwesomeIcon icon={faIndent} />,
    computeState: (editor, path) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const listItemEntry = editor.nearest(entry, ListItemNode)
      const listEntry = editor.nearest(listItemEntry ?? entry, ListNode)
      const active = false
      const disabled = !listEntry || !listItemEntry || !Path.hasPrevious(listItemEntry[1]) || listEntry[0].children.length <= 1

      return { active, disabled, listEntry, listItemEntry, ...getActionParams(editor) }
    },
    action: (editor, path, state) => {
      const { listEntry, listItemEntry } = state
      if (!listItemEntry || !listEntry) {
        return false
      }
      if (editor.wrap(listItemEntry, [ListItemNode, ListNode], [{ spread: undefined, checked: undefined }, { ordered: state.ordered ?? listEntry[0].ordered, spread: undefined, start: state.start }])) {
        Transforms.mergeNodes(editor, { at: listItemEntry[1] })
        return true
      }
      return false
    },
  })

  factory.defineAction<ActionType.phrasing, ListIndentionActionProps>({
    key: 'outdent-list',
    type: ActionType.phrasing,
    icon: <FontAwesomeIcon icon={faOutdent} />,
    computeState: (editor, path) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const listItemEntry = editor.nearest(entry, ListItemNode)
      const listEntry = editor.nearest(listItemEntry ?? entry, ListNode)
      const active = false
      const disabled = !listEntry || !listItemEntry

      return { active, disabled, listEntry, listItemEntry }
    },
    action: (editor, path, state) => {
      const { listEntry, listItemEntry } = state
      if (!listItemEntry || !listEntry) {
        return false
      }
      const pathRef = Editor.pathRef(editor, listItemEntry[1])
      const nextLiPath = Path.next(listItemEntry[1])

      if (Editor.hasPath(editor, nextLiPath)) {
        Transforms.splitNodes(editor, { at: nextLiPath })
      }

      Transforms.splitNodes(editor, { at: listItemEntry[1] })
      if (pathRef.current) {
        const listPath = Path.parent(pathRef.current)
        const newListEntry: NodeEntry = [Node.get(editor, listPath), listPath]
        editor.unwrap(newListEntry, [ListNode, ListItemNode])
        Transforms.splitNodes(editor, { at: listPath })
      }
      pathRef.unref()
      return true
    },
  });

  [true, false].forEach(ordered => {
    const listParam: RemarkElementProps<List> = { ordered, spread: undefined, start: undefined }
    const listItemParam: RemarkElementProps<ListItem> = { spread: undefined, checked: undefined }

    factory.defineAction<ActionType.phrasing, ListToggleActionProps>({
      key: `toggle-${ordered ? 'ordered' : 'unordered'}-list`,
      type: ActionType.phrasing,
      icon: <FontAwesomeIcon icon={ordered ? faListOl : faListUl} />,
      computeState: (editor, path) => {
        const entry: NodeEntry = [Node.get(editor, path), path]
        const listEntry = editor.nearest(entry, ListNode)
        const active = listEntry ? (Boolean(listEntry[0].ordered) === Boolean(ordered)) : false
        let disabled: boolean
        if (listEntry) {
          if (active) {
            disabled = !editor.canUnwrap(listEntry, [ListNode, ListItemNode])
          } else {
            // just transform list type
            disabled = true
          }
        } else {
          disabled = !editor.canWrap(entry, [ListNode, ListItemNode], [listParam, listItemParam])
        }
        return { active, disabled, listEntry }
      },
      action: (editor, path, state) => {
        const entry: NodeEntry = [Node.get(editor, path), path]
        const { ordered, start } = getActionParams(editor)
        if (state.listEntry) {
          if (state.active) {
            return editor.unwrap(state.listEntry, [ListNode, ListItemNode])
          } else {
            Transforms.setNodes(editor, { ordered, start }, { at: state.listEntry[1] })
            return true
          }
        } else {
          return editor.wrap(entry, [ListNode, ListItemNode], [Object.assign({}, listParam, { start }), listItemParam])
        }
      },
    })
  })
}
