import { defineNode } from '/src/slate-markdown/core/elements'
import { Code } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import React from 'react'

const CodeNode = defineNode<Code>({
  type: 'code',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  wrappingParagraph: false,
  render: (editor, { children, attributes }) => {
    return (
      <pre {...attributes}>
        <code>
          {children}
        </code>
      </pre>
    )
  },
  toggle: {},
  events: {},
})

export default CodeNode
