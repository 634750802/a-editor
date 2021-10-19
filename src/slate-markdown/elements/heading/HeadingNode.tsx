import { defineNode, MdastContentType } from '/src/slate-markdown/core/elements'
import { Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { createElement } from 'react'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import classNames from 'classnames'


const HeadingNode = defineNode<Heading>({
  type: 'heading',
  isInline: false,
  isLeaf: false,
  wrappingParagraph: false,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.phrasing,
  render: (editor, { element, children, attributes }) => {
    return (
      <LineWrapper element={element}>
        {({ active }) => createElement(`h${element.depth}`, Object.assign(attributes, { className: classNames({ active })}), children)}
      </LineWrapper>
    )
  },
  toggle: {
    prefix: /^#{1,6}$/,
    estimatePrefixLength: 6,
    // deprecated
    toggle: (editor, path, params) => {
      if (params) {
        editor.runAction(`toggle-heading-${params.depth}`, path)
      } else {
        editor.runAction('toggle-paragraph', path)
      }
    },
    onTrigger: (prefix) => {
      return { depth: prefix.length as Heading['depth'] }
    },
  },
  events: {
    onStartEnter: (editor, path) => {
      return editor.runAction('toggle-paragraph', path)
    },
  },
  toolbarItems: [],
})

export default HeadingNode
