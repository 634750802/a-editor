/* eslint-disable react/jsx-max-depth */
import { defineNode, isContentTypeConforms, MdastContentType } from '../../core/elements'
import { Table } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import LineWrapper from '../../../components/line-wrapper/LineWrapper'
import { TableContext } from './context'
import { faTable } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import classNames from 'classnames'
import { useSelected } from 'slate-react'
import { Transforms } from 'slate'
import TableRowNode from './TableRowNode'

library.add(faTable)

const TableNode = defineNode<Table>({
  type: 'table',
  isInline: false,
  isLeaf: false,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.table,
  wrappingParagraph: false,
  events: {},
  toggle: {},
  normalize: (editor, table, path, preventDefaults) => {
    /// TODO: normalize table
    if (table.children.length === 0) {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
    }
    for (let i = table.children.length - 1; i >= 0; --i) {
      const child = table.children[i]
      const contentType = editor.getContentType(child)
      if (!contentType || !isContentTypeConforms(contentType, TableRowNode.contentType)) {
        Transforms.removeNodes(editor, { at: path.concat(i) })
      }
    }
  },

  render: (editor, { element, attributes, children }) => {
    const selected = useSelected()
    const className = classNames({ selected })
    const [heading, ...body] = children
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const headerContextProps = { isHeader: true, align: element.align }
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const bodyContextProps = { isHeader: false, align: element.align }
    return (
      <LineWrapper element={element}>
        <table
          className={className}
          {...attributes}
        >
          {heading && (
            <TableContext.Provider value={headerContextProps}>
              <thead>
                {heading}
              </thead>
            </TableContext.Provider>
          )}

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
