import { defineNode, ToolbarItemConfig } from '/src/slate-markdown/core/elements'
import { Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { createElement } from 'react'
import { Node, Path, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import { isElementActive } from '/src/slate-markdown/elements/text/TextNode'
import classNames from 'classnames'

const HeadingNode = defineNode<Heading>({
  type: 'heading',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  wrappingParagraph: false,
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
    toggle: (editor, path, params) => {
      if (params) {
        Transforms.setNodes(editor, { type: 'heading', ...params }, { at: path })
      } else {
        Transforms.unsetNodes(editor, 'depth', { at: path })
        Transforms.setNodes(editor, { type: 'paragraph' }, { at: path })
      }
    },
    onTrigger: (prefix) => {
      return { depth: prefix.length as Heading['depth'] }
    },
  },
  events: {
    onStartEnter: (editor, path) => {
      const heading = Node.parent(editor, path)
      if (!isElementType<Heading>(heading, 'heading')) {
        return false
      }
      HeadingNode.toggle.toggle(editor, Path.parent(path), false)
      return true
    }
  },
  toolbarItems: [1, 2, 3, 4, 5, 6].map(depth => {
    const isHeadingActive: ToolbarItemConfig<Path>['isActive'] = (editor, path) => isElementActive<Heading>(editor, path, 'heading', heading => heading.depth === depth)
    return {
      key: `heading-level-${depth}`,
      // eslint-disable-next-line react/jsx-one-expression-per-line
      icon: <>H{depth}</>,
      isActive: isHeadingActive,
      isDisabled: () => false,
      action: (editor, path, event) => {
        if (isHeadingActive(editor, path)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          HeadingNode.toggle.toggle!(editor, path, false)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          HeadingNode.toggle.toggle!(editor, path, { depth } as never)
        }
      },
    }
  }),
})

export default HeadingNode
