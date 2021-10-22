import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { Table, TableRow } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTable } from '@fortawesome/free-solid-svg-icons'
import { ActionType } from '@/slate-markdown/core/actions'
import { Editor, Node, NodeEntry, Path, Transforms } from 'slate'
import TableNode from '@/slate-markdown/elements/table/TableNode'
import { isContentTypeConforms } from '@/slate-markdown/core/elements'
import { requireFields } from '@/components/form'
import createSchema from '@/slate-markdown/elements/table/create-schema.json'
import { isElementType } from '@/slate-markdown/slate-utils'
import { DeleteColumnOutlined, DeleteRowOutlined, InsertRowAboveOutlined, InsertRowBelowOutlined, InsertRowLeftOutlined, InsertRowRightOutlined } from '@ant-design/icons'
import TableCellNode from '@/slate-markdown/elements/table/TableCellNode'
import { ReactEditor } from 'slate-react'

type ToggleTablePrams = {
  tableEntry: NodeEntry<Table> | undefined
}

const getActionParams = (editor: Editor) => {
  let rows: boolean | undefined
  let cols: number | undefined

  if (editor.runActionParams && typeof editor.runActionParams === 'object') {
    const { rows: _rows, cols: _cols } = editor.runActionParams as Record<string, unknown>
    if (typeof _rows === 'boolean') {
      rows = _rows
    }
    if (typeof _cols === 'number') {
      cols = _cols
    }
  }
  return { rows, cols }
}

const getTableCols = (table: Table) => {
  if (table.children.length > 0) {
    return (table.children[0] as TableRow).children.length
  } else {
    return 0
  }
}

function getRowPath (editor: Editor, tablePath: Path, defaultRow: number): Path {
  let tableRowEntry: NodeEntry<TableRow> | undefined
  if (editor.selection) {
    [tableRowEntry] = Editor.nodes<TableRow>(editor, { at: editor.selection, mode: 'lowest', match: node => isElementType<TableRow>(node, 'tableRow') })
  }
  return tableRowEntry ? tableRowEntry[1] : tablePath.concat(defaultRow)
}

function getColIndex (editor: Editor, defaultIndex: number): number {
  let colIndex: number | undefined = undefined
  if (editor.selection) {
    const cursorPath = editor.selection.focus.path
    const tableColEntry = editor.nearest([Node.get(editor, cursorPath), cursorPath], TableCellNode)
    if (tableColEntry) {
      colIndex = tableColEntry[1][tableColEntry[1].length - 1]
    }
  }
  if (typeof colIndex !== 'number') {
    colIndex = defaultIndex
  }
  return colIndex
}

function insertRow (editor: Editor, rowPath: Path, cols: number) {
  Transforms.insertNodes(editor, {
    type: 'tableRow',
    children: Array(cols).fill(0).map(() => ({
      type: 'tableCell',
      children: [{ text: '' }],
    })),
  }, { at: rowPath })
}

function insertCols (editor: Editor, tableEntry: NodeEntry<Table>, colIndex: number) {
  for (const [i] of Array(tableEntry[0].children.length).fill(0).entries()) {
    const colPath = tableEntry[1].concat(i, colIndex)
    Transforms.insertNodes(editor, {
      type: 'tableCell',
      children: [{
        text: '',
      }],
    }, { at: colPath })
  }
}

export function register (factory: EditorFactory) {
  factory.defineAction<ActionType.phrasing, ToggleTablePrams>({
    key: 'toggle-table',
    type: ActionType.phrasing,
    icon: <FontAwesomeIcon icon={faTable} />,
    computeState: (editor, path) => {
      const node = Node.get(editor, path)
      const active = isElementType(node, 'table')
      let tableEntry: NodeEntry<Table> | undefined
      let disabled: boolean
      if (active) {
        disabled = false
        tableEntry = [node as Table, path]
      } else {
        const parent = Node.parent(editor, path)
        const parentContentModelType = editor.getContentModelType(parent)
        if (!parentContentModelType) {
          disabled = true
        } else {
          disabled = !isContentTypeConforms(TableNode.contentType, parentContentModelType)
        }
      }

      return { active, disabled, tableEntry }
    },
    action: (editor, path, state, event) => {
      if (state.active) {
        if (!state.tableEntry) {
          return false
        }
        const [node, path] = state.tableEntry
        const text = [...Node.texts(node)].map(([node]) => node.text).join(' ')
        Transforms.removeNodes(editor, { at: path })
        Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text }] }, { at: path })
        return true
      } else {
        const pathRef = Editor.pathRef(editor, path)
        requireFields<{ rows: number, cols: number }>(editor, event.target as HTMLElement, createSchema as never, { cols: 2, rows: 2 })
          .then((data) => {
            const path = pathRef.current
            if (!path) {
              return
            }
            if (data) {
              Editor.withoutNormalizing(editor, () => {
                const { cols, rows } = data
                Transforms.removeNodes(editor, { at: path })
                Transforms.insertNodes(editor, {
                  type: 'table',
                  align: undefined,
                  children: Array(rows).fill(0).map(() => ({
                    type: 'tableRow',
                    children: Array(cols).fill(0).map(() => ({
                      type: 'tableCell',
                      children: [{ text: '' }],
                    })),
                  })),
                }, { at: path })
              })
            }
          })
          .finally(() => pathRef.unref())
        return true
      }
    },
  })

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'remove-selection-table',
    type: ActionType.selection,
    icon: <FontAwesomeIcon icon={faTable} />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes(editor, { at: range, match: node => isElementType<Table>(node, 'table') })
      const active = !!tableEntry
      const disabled = !tableEntry
      return { active, disabled, tableEntry: tableEntry as NodeEntry<Table> }
    },
    action: (editor, location, state) => {
      if (!state.tableEntry) {
        return false
      }
      const [node, path] = state.tableEntry
      const text = [...Node.texts(node)].map(([node]) => node.text).join(' ')
      Transforms.removeNodes(editor, { at: path })
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text }] }, { at: path, select: true })
      return true
    },
  })

  type TableOperationProps = {
    tableEntry: NodeEntry<Table> | undefined
  }

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'table-insert-row-above',
    type: ActionType.selection,
    icon: <InsertRowAboveOutlined />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes<Table>(editor, { at: range, mode: 'lowest', match: node => isElementType<Table>(node, 'table') })
      return { active: false, disabled: !tableEntry, tableEntry }
    },
    action: (editor, range, state) => {
      if (!state.tableEntry) {
        return false
      }
      const [tableNode, tablePath] = state.tableEntry
      const rowPath = getRowPath(editor, tablePath, 0)
      const cols = getTableCols(tableNode)
      insertRow(editor, rowPath, cols)
      return true
    },
  })

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'table-insert-row-below',
    type: ActionType.selection,
    icon: <InsertRowBelowOutlined />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes<Table>(editor, { at: range, mode: 'lowest', match: node => isElementType<Table>(node, 'table') })
      return { active: false, disabled: !tableEntry, tableEntry }
    },
    action: (editor, range, state) => {
      if (!state.tableEntry) {
        return false
      }
      const [tableNode, tablePath] = state.tableEntry
      const rowPath = getRowPath(editor, tablePath, tableNode.children.length - 1)
      rowPath[rowPath.length - 1] += 1
      const cols = getTableCols(tableNode)
      insertRow(editor, rowPath, cols)
      return true
    },
  })

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'table-insert-row-left',
    type: ActionType.selection,
    icon: <InsertRowLeftOutlined />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes<Table>(editor, { at: range, mode: 'lowest', match: node => isElementType<Table>(node, 'table') })
      return { active: false, disabled: !tableEntry, tableEntry }
    },
    action: (editor, range, state) => {
      if (!state.tableEntry) {
        return false
      }
      const colIndex = getColIndex(editor, 0)
      insertCols(editor, state.tableEntry, colIndex)
      return true
    },
  })

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'table-insert-row-right',
    type: ActionType.selection,
    icon: <InsertRowRightOutlined />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes<Table>(editor, { at: range, mode: 'lowest', match: node => isElementType<Table>(node, 'table') })
      return { active: false, disabled: !tableEntry, tableEntry }
    },
    action: (editor, range, state) => {
      if (!state.tableEntry) {
        return false
      }
      const colIndex = getColIndex(editor, getTableCols(state.tableEntry[0]) - 1) + 1
      insertCols(editor, state.tableEntry, colIndex)
      return true
    },
  })

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'table-delete-row',
    type: ActionType.selection,
    icon: <DeleteRowOutlined />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes<Table>(editor, { at: range, mode: 'lowest', match: node => isElementType<Table>(node, 'table') })
      return { active: false, disabled: !tableEntry || tableEntry[0].children.length <= 1, tableEntry }
    },
    action: (editor, location, state) => {
      if (!state.tableEntry) {
        return false
      }
      const [, tablePath] = state.tableEntry
      const path = getRowPath(editor, tablePath, 0)
      Transforms.removeNodes(editor, { at: path })
      Transforms.deselect(editor)
      return true
    },
  })

  factory.defineAction<ActionType.selection, TableOperationProps>({
    key: 'table-delete-col',
    type: ActionType.selection,
    icon: <DeleteColumnOutlined />,
    computeState: (editor, range) => {
      const [tableEntry] = Editor.nodes<Table>(editor, { at: range, mode: 'lowest', match: node => isElementType<Table>(node, 'table') })
      return { active: false, disabled: !tableEntry || getTableCols(tableEntry[0]) <= 1, tableEntry }
    },
    action: (editor, location, state) => {
      if (!state.tableEntry) {
        return false
      }
      const [, tablePath] = state.tableEntry
      const colId = getColIndex(editor, 0)
      Transforms.removeNodes(editor, { at: tablePath, match: (node, path) => isElementType(node, 'tableCell') && path[path.length - 1] === colId })
      Transforms.deselect(editor)
      return true
    },
  })

}
