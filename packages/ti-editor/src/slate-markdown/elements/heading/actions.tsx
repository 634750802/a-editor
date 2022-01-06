import { EditorFactory } from '../../core/editor-factory'
import { ActionType } from '../../core/actions'
import { Node, NodeEntry } from 'slate'
import HeadingNode from './HeadingNode'
import ParagraphNode from '../paragraph/ParagraphNode'
import { Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'

export function register (editorFactory: EditorFactory): void {
  ([1, 2, 3, 4, 5, 6] as Heading['depth'][]).forEach(depth => {
    const icon = `H${depth}`
    editorFactory.defineAction({
      key: `toggle-heading-${depth}`,
      type: ActionType.phrasing,
      defaultParams: {
        depth,
      },
      icon: (
        <span>
          {icon}
        </span>
      ),
      computeState: (editor, path) => {
        const entry: NodeEntry = [Node.get(editor, path), path]
        const headingEntry = editor.nearest(entry, HeadingNode)
        const active = !!headingEntry && headingEntry[0].depth === depth
        let disabled
        if (headingEntry) {
          disabled = !editor.canToggle(headingEntry, ParagraphNode, false)
        } else {
          disabled = !editor.canToggle(entry, HeadingNode, true)
        }
        return { active, disabled, depth }
      },
      action: (editor, path, state) => {
        const entry: NodeEntry = [Node.get(editor, path), path]
        if (state.active) {
          return editor.toggle(entry, ParagraphNode, undefined)
        } else {
          return editor.toggle(entry, HeadingNode, { depth })
        }
      },
    })
  })
}
