import { EditorFactory } from '../../core/editor-factory'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { Node, NodeEntry } from 'slate'
import { ActionType } from '../../core/actions'
import BlockquoteNode from './BlockquoteNode'

export function register (factory: EditorFactory): void {

  type ToggleBlockquoteParams = {
    blockquoteEntry?: NodeEntry
  }

  factory.defineAction<ActionType.phrasing, ToggleBlockquoteParams>({
    key: 'toggle-blockquote',
    icon: <FontAwesomeIcon icon={faQuoteLeft} />,
    type: ActionType.phrasing,
    computeState: (editor, path) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const blockquoteEntry = editor.nearest(entry, BlockquoteNode)
      const active = !!blockquoteEntry
      let disabled: boolean
      if (blockquoteEntry) {
        disabled = !editor.canUnwrap(blockquoteEntry, [BlockquoteNode])
      } else {
        disabled = !editor.canToggle(entry, BlockquoteNode, false)
      }
      return { active, disabled, blockquoteEntry }
    },
    action: (editor, path, state) => {
      if (state.active) {
        if (state.blockquoteEntry) {
          return editor.unwrap(state.blockquoteEntry, [BlockquoteNode])
        }
      } else {
        return editor.toggle([Node.get(editor, path), path], BlockquoteNode, undefined)
      }
      return false
    },
  })

  factory.defineAction({
    key: 'indent-blockquote',
    icon: <FontAwesomeIcon icon={faQuoteLeft} />,
    type: ActionType.phrasing,
    computeState: (editor, path) => {
      return { active: false, disabled: !editor.canToggle([Node.get(editor, path), path], BlockquoteNode, false) }
    },
    action: (editor, path) => {
      return editor.toggle([Node.get(editor, path), path], BlockquoteNode, undefined)
    },
  })

  factory.defineAction<ActionType.phrasing, ToggleBlockquoteParams>({
    key: 'outdent-blockquote',
    icon: <FontAwesomeIcon icon={faQuoteLeft} />,
    type: ActionType.phrasing,
    computeState: (editor, path) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const blockquoteEntry = editor.nearest(entry, BlockquoteNode)

      const active = !!blockquoteEntry
      const disabled = !blockquoteEntry || !editor.canUnwrap(blockquoteEntry, [BlockquoteNode])

      return { active, disabled, blockquoteEntry }

      return { active: false, disabled: !editor.canToggle([Node.get(editor, path), path], BlockquoteNode, false) }
    },
    action: (editor, path, state) => {
      if (state.blockquoteEntry) {
        return editor.unwrap(state.blockquoteEntry, [BlockquoteNode])
      }
      return false
    },
  })
}
