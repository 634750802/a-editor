import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { override } from '@/utils/override'
import { Editor, Node, Path, Point, Range, Transforms } from 'slate'
import { isElementType } from '@/slate-markdown/slate-utils'

function clearTablePart (editor: Editor, range: Range, tablePath: Path) {
  const entries = Editor.nodes(editor, {
    at: tablePath,
    mode: 'highest',
    match: (node, path) => {
      return path.length > 2 && Path.isParent(tablePath, Path.parent(Path.parent(path)))
    },
  })
  for (const [, path] of entries) {
    const common = Range.intersection(range, Editor.range(editor, path))
    if (common && !Range.isCollapsed(common)) {
      // only delete all table cell data.
      Transforms.delete(editor, { at: common })
    }
  }
}

function parentTablePath (editor: Editor, point: Point, checkEdge: 'start' | 'end'): [path: Path, isEdge: boolean] | undefined {
  for (const [node, path] of Node.ancestors(editor, point.path, { reverse: true })) {
    if (isElementType(node, 'table')) {
      const edge = checkEdge === 'start' ? Editor.isStart(editor, point, path) : Editor.isEnd(editor, point, path)
      return [path, edge]
    }
  }
  return undefined
}

function isTableCellEdge (editor: Editor, point: Point, checkEdge: 'start' | 'end'): boolean {
  for (const [node, path] of Node.ancestors(editor, point.path, { reverse: true })) {
    if (isElementType(node, 'tableCell')) {
      return checkEdge === 'start' ? Editor.isStart(editor, point, path) : Editor.isEnd(editor, point, path)
    }
  }
  return false
}

export function register (factory: EditorFactory) {
  factory.onWrapEditor(editor => {
    override(editor, 'deleteFragment', deleteFragment => {
      return dir => {
        if (editor.selection) {
          const { anchor, focus } = editor.selection
          const reverse = Point.isAfter(anchor, focus)
          const anchorMatch = parentTablePath(editor, anchor, reverse ? 'start' : 'end')
          const focusMatch = parentTablePath(editor, focus, reverse ? 'end' : 'start')
          if (anchorMatch && focusMatch && Path.equals(anchorMatch[0], focusMatch[0])) {
            clearTablePart(editor, editor.selection, anchorMatch[0])
            return
          }
          const range = { ...editor.selection }
          if (anchorMatch) {
            const [path, isEdge] = anchorMatch
            if (!isEdge) {
              clearTablePart(editor, editor.selection, path)
            }
            range.anchor = Editor.point(editor, Path[reverse ? 'previous' : 'next'](path), { edge: reverse ? 'end' : 'start' })
          }
          if (focusMatch) {
            const [path, isEdge] = focusMatch
            if (!isEdge) {
              clearTablePart(editor, editor.selection, path)
            }
            range.focus = Editor.point(editor, Path[reverse ? 'next' : 'previous'](path), { edge: reverse ? 'start' : 'end' })
          }
          Transforms.select(editor, Editor.unhangRange(editor, range))
        }
        deleteFragment(dir)
      }
    })
    override(editor, 'deleteForward', deleteForward => {
      return (unit) => {
        if (editor.selection) {
          const after = Editor.after(editor, editor.selection, { unit })
          if (after) {
            const matchedTable = parentTablePath(editor, after, 'start')
            if (matchedTable) {
              const [tablePath, isTableEdge] = matchedTable
              if (isTableEdge) {
                // delete table if delete before table
                Transforms.removeNodes(editor, { at: tablePath })
                return
              }
            }
          }
          const isCellEnd = isTableCellEdge(editor, Editor.point(editor, editor.selection, { edge: 'end' }), 'end')
          if (isCellEnd) {
            // prevent delete table cell
            return
          }
        }
        deleteForward(unit)
      }
    })
    override(editor, 'deleteBackward', deleteBackward => {
      return (unit) => {
        if (editor.selection) {
          const before = Editor.before(editor, editor.selection, { unit })
          if (before) {
            const matchedTable = parentTablePath(editor, before, 'end')
            if (matchedTable) {
              const [tablePath, isTableEdge] = matchedTable
              if (isTableEdge) {
                // delete table if delete before table
                Transforms.removeNodes(editor, { at: tablePath })
                return
              }
            }
          }
          const isCellStart = isTableCellEdge(editor, Editor.point(editor, editor.selection, { edge: 'start' }), 'start')
          if (isCellStart) {
            // prevent delete table cell
            return
          }
        }
        deleteBackward(unit)
      }
    })
  })
  override(factory, 'createDefaultEditableProps', cp => {
    return editor => {
      // prevent drag table
      return override(cp(editor), 'onDrag', onDrag => {
        return event => {
          const [table] = Editor.nodes(editor, { match: node => isElementType(node, 'table') })
          if (table) {
            event.preventDefault()
            event.stopPropagation()
          }
          onDrag?.(event)
        }
      })
    }
  })
}
