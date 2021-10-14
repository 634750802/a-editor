import { defineNode } from '/src/slate-markdown/core/elements'
import { Code } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import React from 'react'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import classNames from 'classnames'

const CodeNode = defineNode<Code>({
  type: 'code',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  wrappingParagraph: false,
  render: (editor, { element, children, attributes }) => {
    return (
      <LineWrapper element={element}>
        {({ active }) => (
          <pre
            className={classNames({ active })}
            {...attributes}
          >
            <code>
              {children}
            </code>
          </pre>
        )}
      </LineWrapper>
    )
  },
  toggle: {},
  events: {},
  toolbarItems: []
})

export default CodeNode
