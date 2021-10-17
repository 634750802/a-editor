import { defineNode, MdastContentType } from '/src/slate-markdown/core/elements'
import { TableCell } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { TableContext } from '/src/slate-markdown/elements/table/context'

const TableCellNode = defineNode<TableCell>({
  type: 'tableCell',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  contentType: MdastContentType.tableRow,
  contentModelType: MdastContentType.phrasing,
  wrappingParagraph: false,
  events: {},
  toggle: {},

  toolbarItems: [],
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
