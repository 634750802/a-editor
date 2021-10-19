import { defineNode, MdastContentType } from '/src/slate-markdown/core/elements'
import { Table, TableRow } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'

const TableRowNode = defineNode<TableRow>({
  type: 'tableRow',
  isInline: false,
  isLeaf: false,
  contentType: MdastContentType.table,
  contentModelType: MdastContentType.tableRow,
  wrappingParagraph: false,
  events: {},
  toggle: {},

  render: (editor, { element, attributes, children }) => {
    return (
      <tr {...attributes}>
        {children}
      </tr>
    )
  },
})

export default TableRowNode
