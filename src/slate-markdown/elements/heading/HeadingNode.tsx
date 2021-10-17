import { defineNode, MdastContentType, ToolbarItemConfig } from '/src/slate-markdown/core/elements'
import { Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { createElement } from 'react'
import { Node, NodeEntry, Path } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import classNames from 'classnames'
import ParagraphNode from '/src/slate-markdown/elements/paragraph/ParagraphNode'


const toolbarItems: ToolbarItemConfig<Path>[] = ([1, 2, 3, 4, 5, 6] as Heading['depth'][]).map(depth => {
  // const isHeadingActive: ToolbarItemConfig<Path>['isActive'] = (editor, path) => isElementActive<Heading>(editor, path, 'heading', heading => heading.depth === depth)
  const isHeadingActive: ToolbarItemConfig<Path>['isActive'] = (editor, path) => {
    const entry: NodeEntry = [Node.get(editor, path), path]
    const nearestEntry = editor.nearest(entry, HeadingNode)
    return !!(nearestEntry && nearestEntry[0].depth === depth)
  }
  const isHeadingDisabled: ToolbarItemConfig<Path>['isDisabled'] = (editor, path) => {
    const entry: NodeEntry = [Node.get(editor, path), path]
    const headingEntry = editor.nearest(entry, HeadingNode)
    if (headingEntry) {
      return !editor.canToggle(headingEntry, ParagraphNode, false)
    } else {
      return !editor.canToggle(entry, HeadingNode, true)
    }
  }
  return {
    key: `heading-level-${depth}`,
    // eslint-disable-next-line react/jsx-one-expression-per-line
    icon: <>H{depth}</>,
    isActive: isHeadingActive,
    isDisabled: isHeadingDisabled,
    action: (editor, path, event) => {
      const entry: NodeEntry = [Node.get(editor, path), path]
      const headingEntry = editor.nearest(entry, HeadingNode)
      if (headingEntry) {
        editor.toggle(headingEntry, ParagraphNode, undefined)
      } else {
        editor.toggle<Heading>(entry, HeadingNode, { depth })
      }
    },
  }
})

const HeadingNode = defineNode<Heading>({
  type: 'heading',
  isInline: false,
  isLeaf: false,
  isVoid: false,
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
        editor.toggle([Node.get(editor, path), path], HeadingNode, params)
      } else {
        editor.toggle([Node.get(editor, path), path], ParagraphNode, undefined)
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
      editor.toggle([heading, Path.parent(path)], ParagraphNode, undefined)
      return true
    },
  },
  toolbarItems: toolbarItems,
})

export default HeadingNode
