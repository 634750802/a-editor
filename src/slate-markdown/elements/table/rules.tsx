import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { override } from '@/utils/override'
import { Editor, Path, Point, Range, Transforms } from 'slate'
import { isElementType } from '@/slate-markdown/slate-utils'

export function register (factory: EditorFactory) {
  factory.onWrapEditor(editor => {
    override(editor, 'deleteFragment', deleteFragment => {
      return dir => {
        if (editor.selection) {
          const [...tables] = Editor.nodes(editor, { at: editor.selection, match: node => isElementType(node, 'table'), mode: 'highest' })
          if (tables.length) {
            const selectionRef = Editor.rangeRef(editor, editor.selection)
            // range set excludes table regions (or includes a whole table)
            const rangeSet: Range[] = []
            const [rangeStart, rangeEnd] = Editor.edges(editor, editor.selection)
            let currentStart = rangeStart
            for (const [, tablePath] of tables) {
              let shouldHandleTable = true
              const end = Editor.point(editor, Path.next(tablePath), { edge: 'start' })
              if (Path.hasPrevious(tablePath)) {
                const start = Editor.point(editor, Path.previous(tablePath), { edge: 'end' })
                if (Point.isBefore(currentStart, start)) {
                  if (Point.isBefore(end, rangeEnd)) {
                    // entire table should be deleted
                    rangeSet.push(Editor.range(editor, tablePath))
                    shouldHandleTable = false
                  } else {
                    // part of table should deleted
                    rangeSet.push(Editor.unhangRange(editor, { anchor: currentStart, focus: start }))
                  }
                }
              }
              currentStart = end
              if (!shouldHandleTable) {
                continue
              }
              const entries = Editor.nodes(editor, {
                match: (node, path) => {
                  return path.length > 2 && Path.isParent(tablePath, Path.parent(Path.parent(path)))
                },
              })
              for (const [, path] of entries) {
                const common = Range.intersection(editor.selection, Editor.range(editor, path))
                if (common && !Range.isCollapsed(common)) {
                  // only delete all table cell data.
                  Transforms.delete(editor, { at: common })
                }
              }
            }
            if (Point.isBefore(currentStart, rangeEnd)) {
              rangeSet.push({ anchor: currentStart, focus: rangeEnd })
            }
            for (const range of rangeSet.reverse()) {
              // delete all other regions
              Transforms.select(editor, Editor.unhangRange(editor, range))
              deleteFragment(dir)
            }
            // recover selections
            if (selectionRef.current) {
              Transforms.select(editor, selectionRef.current)
            }
            selectionRef.unref()
            return
          }
        }
        deleteFragment(dir)
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
