import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { ActionType } from '@/slate-markdown/core/actions'
import { Node, NodeEntry, Transforms } from 'slate'
import ParagraphNode from '@/slate-markdown/elements/paragraph/ParagraphNode'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faParagraph } from '@fortawesome/free-solid-svg-icons'
import React from 'react'

export function register (editorFactory: EditorFactory): void {
  editorFactory.defineAction({
    key: `toggle-paragraph`,
    type: ActionType.phrasing,
    icon: <FontAwesomeIcon icon={faParagraph} />,
    computeState: (editor, path) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const pEntry = editor.nearest(entry, ParagraphNode)
      const active = !!pEntry
      let disabled
      if (pEntry) {
        disabled = true
      } else {
        disabled = !editor.canToggle(entry, ParagraphNode, true)
      }
      return { active, disabled }
    },
    action: (editor, path, state) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      if (state.active) {
        return false
      } else {
        return editor.toggle(entry, ParagraphNode, undefined)
      }
    },
  })
  editorFactory.defineAction({
    key: 'insert-paragraph',
    type: ActionType.toplevel,
    icon: <FontAwesomeIcon icon={faParagraph} />,
    computeState: () => ({ active: false, disabled: false }),
    action: (editor, path, state) => {
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: path, select: true })
      return true
    },
  })
}
