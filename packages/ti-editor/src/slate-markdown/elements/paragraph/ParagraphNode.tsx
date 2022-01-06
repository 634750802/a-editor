import { defineNode, MdastContentType, TypedRenderElementProps } from '../../core/elements'
import { Paragraph } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor } from 'slate'
import React from 'react'
import LineWrapper from '../../../components/line-wrapper/LineWrapper'
import classNames from 'classnames'
import { faParagraph } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faParagraph)

const ParagraphNode = defineNode<Paragraph>({
  type: 'paragraph',
  isLeaf: false,
  isInline: false,
  wrappingParagraph: false, // only for trigger; do not add block event handlers. add them in list item.
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.phrasing,
  toggle: {},
  events: {},
  render (editor: Editor, { element, attributes, children }: TypedRenderElementProps<Paragraph>): JSX.Element {
    return (
      <LineWrapper element={element}>
        {({ active }) => (
          <p
            className={classNames({ active })}
            {...attributes}
          >
            {children}
          </p>
        )}
      </LineWrapper>
    )
  },
})

export default ParagraphNode
