import { defineNode, isContentTypeConforms, MdastContentType } from '@/slate-markdown/core/elements'
import { TableRow } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { isElementType } from '@/slate-markdown/slate-utils'
import { Editor, Node, Text, Transforms } from 'slate'
import TableCellNode from '@/slate-markdown/elements/table/TableCellNode'
import { Table } from 'remark-slate-transformer/lib/models/mdast'

const TableRowNode = defineNode<TableRow>({
  type: 'tableRow',
  isInline: false,
  isLeaf: false,
  contentType: MdastContentType.table,
  contentModelType: MdastContentType.tableRow,
  wrappingParagraph: false,
  events: {},
  toggle: {},

  normalize: (editor, node, path, preventDefaults) => {
    for (const [i, child] of node.children.entries()) {
      if (!isElementType(child, 'tableCell')) {
        const type = editor.getContentType(child)
        if (type) {
          if (isContentTypeConforms(type, TableCellNode.contentModelType!)) {
            Transforms.unsetNodes(editor, Object.keys(Node.extractProps(child)), { at: path.concat(i) })
            Transforms.setNodes(editor, { type: 'tableCell' }, { at: path.concat(i) })
          } else {
            const [...nodes] = Editor.nodes(editor, {
              at: path.concat(i), mode: 'highest', match: n => {
                if (Text.isText(n)) {
                  return true
                }
                const contentType = editor.getContentType(n)
                return !!contentType && isContentTypeConforms(contentType, MdastContentType.phrasing)
              },
            })
            const transformedChildren = nodes.map(entry => entry[0])
            if (transformedChildren.length === 0) {
              transformedChildren[0] = { text: '' }
            }
            Transforms.removeNodes(editor, { at: path.concat(i) })
            Transforms.insertNodes(editor, { type: 'tableCell', children: nodes.map(entry => entry[0]) }, { at: path.concat(i), select: true })
          }
        }
      }
    }
    const rolCols = node.children.length
    const tableCols = (Node.parent(editor, path) as Table).children[0].children.length
    if (rolCols === 0) {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
    } else if (rolCols < tableCols) {
      Transforms.insertNodes(editor, Array(tableCols - rolCols).fill({ type: 'tableCell', children: [{ text: '' }] }), { at: path.concat(rolCols) })
    } else {
      for (let i = rolCols - 1; i >= tableCols; i--) {
        Transforms.removeNodes(editor, { at: path.concat(i) })
      }
    }
  },

  render: (editor, { element, attributes, children }) => {
    return (
      <tr {...attributes}>
        {children}
      </tr>
    )
  },
})

export default TableRowNode
