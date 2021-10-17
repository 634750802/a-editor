/* eslint-disable react/jsx-max-depth */
import { defineNode, isContentTypeConforms, MdastContentType, ToolbarItemConfig } from '/src/slate-markdown/core/elements'
import { Table, TableRow } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import { InsertRowAboveOutlined, InsertRowBelowOutlined, InsertRowLeftOutlined, InsertRowRightOutlined } from '@ant-design/icons'
import { Editor, Node, Path, Transforms } from 'slate'
import TableRowNode from '/src/slate-markdown/elements/table/TableRowNode'
import { TableContext } from '/src/slate-markdown/elements/table/context'
import TableCellNode from '/src/slate-markdown/elements/table/TableCellNode'
import { faTable } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { isElementType } from '/src/slate-markdown/slate-utils'
import { requireFields } from '/src/components/form'
import createSchema from './create-schema.json'

library.add(faTable)

const getTableRows = (table: Table) => {
  return table.children.length
}

const getTableCols = (table: Table) => {
  if (table.children.length > 0) {
    return (table.children[0] as TableRow).children.length
  } else {
    return 0
  }
}


const toolbarItems: ToolbarItemConfig<Path>[] = [{
  key: 'toggle-table',
  icon: <FontAwesomeIcon icon={faTable} />,
  isActive: (editor: Editor, path: Path) => isElementType(Node.get(editor, path), 'table'),
  isDisabled: (editor, path) => {
    const node = Node.get(editor, path)
    if (isElementType(node, 'table')) {
      return false
    }
    const parent = Node.parent(editor, path)
    const parentContentModelType = editor.getContentModelType(parent)
    if (!parentContentModelType) {
      return true
    }
    return !isContentTypeConforms(TableNode.contentType, parentContentModelType)
  },
  action: (editor, path, event) => {
    const node = Node.get(editor, path)
    if (isElementType(node, 'table')) {
      const text = [...Node.texts(node)].map(([node]) => node.text).join(' ')
      Transforms.removeNodes(editor, { at: path })
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text }] }, { at: path })
    } else {
      requireFields<{ rows: number, cols: number }>(editor, event.target as HTMLElement, createSchema as never, { cols: 2, rows: 2 })
        .then((data) => {
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
    }
  },
}, {
  key: 'table-insert-row-above',
  icon: <InsertRowAboveOutlined />,
  isActive: () => false,
  isDisabled: (editor, path) => !editor.nearest([Node.get(editor, path), path], TableNode),
  action: (editor, path, event) => {
    const tableEntry = editor.nearest([Node.get(editor, path), path], TableNode)
    if (!tableEntry) {
      return
    }

    let rowPath!: Path
    if (editor.selection) {
      const cursorPath = editor.selection.focus.path
      const tableRowEntry = editor.nearest([Node.get(editor, cursorPath), cursorPath], TableRowNode)
      if (tableRowEntry) {
        rowPath = tableRowEntry[1]
      }
    }
    if (!rowPath) {
      rowPath = tableEntry[1].concat(0)
    }

    const cols = getTableCols(tableEntry[0])

    Transforms.insertNodes(editor, {
      type: 'tableRow',
      children: Array(cols).fill(0).map(() => ({
        type: 'tableCell',
        children: [{ text: '' }],
      })),
    }, { at: rowPath })
  },
}, {
  key: 'table-insert-row-below',
  icon: <InsertRowBelowOutlined />,
  isActive: () => false,
  isDisabled: (editor, path) => !editor.nearest([Node.get(editor, path), path], TableNode),
  action: (editor, path, event) => {
    const tableEntry = editor.nearest([Node.get(editor, path), path], TableNode)
    if (!tableEntry) {
      return
    }

    let rowPath!: Path
    if (editor.selection) {
      const cursorPath = editor.selection.focus.path
      const tableRowEntry = editor.nearest([Node.get(editor, cursorPath), cursorPath], TableRowNode)
      if (tableRowEntry) {
        rowPath = tableRowEntry[1]
      }
    }
    if (!rowPath) {
      rowPath = tableEntry[1].concat(getTableRows(tableEntry[0]) - 1)
    }

    rowPath = Path.next(rowPath)

    const cols = getTableCols(tableEntry[0])

    Transforms.insertNodes(editor, {
      type: 'tableRow',
      children: Array(cols).fill(0).map(() => ({
        type: 'tableCell',
        children: [{ text: '' }],
      })),
    }, { at: rowPath })
  },
}, {
  key: 'table-insert-row-left',
  icon: <InsertRowLeftOutlined />,
  isActive: () => false,
  isDisabled: (editor, path) => !editor.nearest([Node.get(editor, path), path], TableNode),
  action: (editor, path, event) => {
    const tableEntry = editor.nearest([Node.get(editor, path), path], TableNode)
    if (!tableEntry) {
      return
    }

    let colIndex: number | undefined = undefined
    if (editor.selection) {
      const cursorPath = editor.selection.focus.path
      const tableColEntry = editor.nearest([Node.get(editor, cursorPath), cursorPath], TableCellNode)
      if (tableColEntry) {
        colIndex = tableColEntry[1][tableColEntry[1].length - 1]
      }
    }
    if (typeof colIndex !== 'number') {
      colIndex = 0
    }


    for (const [i] of Array(tableEntry[0].children.length).fill(0).entries()) {
      const colPath = tableEntry[1].concat(i, colIndex)
      Transforms.insertNodes(editor, {
        type: 'tableCell',
        children: [{
          text: '',
        }],
      }, { at: colPath })
    }
  },
}, {
  key: 'table-insert-row-right',
  icon: <InsertRowRightOutlined />,
  isActive: () => false,
  isDisabled: (editor, path) => !editor.nearest([Node.get(editor, path), path], TableNode),
  action: (editor, path, event) => {
    const tableEntry = editor.nearest([Node.get(editor, path), path], TableNode)
    if (!tableEntry) {
      return
    }

    let colIndex: number | undefined = undefined
    if (editor.selection) {
      const cursorPath = editor.selection.focus.path
      const tableColEntry = editor.nearest([Node.get(editor, cursorPath), cursorPath], TableCellNode)
      if (tableColEntry) {
        colIndex = tableColEntry[1][tableColEntry[1].length - 1]
      }
    }
    if (typeof colIndex !== 'number') {
      colIndex = getTableCols(tableEntry[0]) - 1
    }

    colIndex += 1

    for (const [i] of Array(tableEntry[0].children.length).fill(0).entries()) {
      const colPath = tableEntry[1].concat(i, colIndex)
      Transforms.insertNodes(editor, {
        type: 'tableCell',
        children: [{
          text: '',
        }],
      }, { at: colPath })
    }
  },
}]

const TableNode = defineNode<Table>({
  type: 'table',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.table,
  wrappingParagraph: false,
  events: {},
  toggle: {},

  toolbarItems,
  render: (editor, { element, attributes, children }) => {
    const [heading, ...body] = children
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const headerContextProps = { isHeader: true, align: element.align }
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const bodyContextProps = { isHeader: false, align: element.align }
    return (
      <LineWrapper element={element}>
        <table {...attributes}>
          <TableContext.Provider value={headerContextProps}>
            <thead>
              {heading}
            </thead>
          </TableContext.Provider>

          <TableContext.Provider value={bodyContextProps}>
            <tbody>
              {body}
            </tbody>
          </TableContext.Provider>
        </table>
      </LineWrapper>
    )
  },
})

export default TableNode
