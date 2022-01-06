import { defineNode, MdastContentType } from '../../core/elements'
import { TableCell } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { TableContext } from './context'

const TableCellNode = defineNode<TableCell>({
  type: 'tableCell',
  isInline: false,
  isLeaf: false,
  contentType: MdastContentType.tableRow,
  contentModelType: MdastContentType.phrasing,
  wrappingParagraph: false,
  events: {
    onStartDelete: (editor, path) => {
      return true
    },
    onInsertParagraph: (editor, path) => {
      editor.insertText('\n')
      return true
    }
  },
  toggle: {},

  render: (editor, { element, attributes, children }) => {
    return (
      <TableContext.Consumer>
        {({ isHeader }) => (
          isHeader ? (
            <th {...attributes}>
              {children}
            </th>
          ) : (
            <td {...attributes}>
              {children}
            </td>
          )
        )}
      </TableContext.Consumer>
    )
  },
})

export default TableCellNode
