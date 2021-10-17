import { defineNode, MdastContentType, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Paragraph } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Transforms } from 'slate'
import React from 'react'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
  toolbarItems: [{
    key: 'insert-paragraph',
    isActive: () => false,
    isDisabled: (editor, path) => path.length > 1,
    icon: <FontAwesomeIcon icon={faParagraph} />,
    action: (editor, path) => {
      if (path.length > 1) {
        return
      }
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }]}, { at: path })
    }
  }],
})

export default ParagraphNode
