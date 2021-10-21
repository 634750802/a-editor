import { defineNode, MdastContentType } from '@/slate-markdown/core/elements'
import { Heading } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { createElement } from 'react'
import LineWrapper from '@/components/line-wrapper/LineWrapper'
import classNames from 'classnames'
import { Editor, Path, Transforms } from 'slate'


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
    onInsertParagraph: (editor) => {
      if (!editor.selection) {
        return false
      }
      const point = Editor.point(editor, editor.selection)
      const path = Path.parent(Editor.path(editor, editor.selection))
      if (Editor.isStart(editor, point, path)) {
        return editor.runAction('toggle-paragraph', path)
      } else if (Editor.isEnd(editor, point, path)) {
        return editor.runAction('insert-paragraph', Path.next(path))
      } else {
        Transforms.splitNodes(editor, { at: editor.selection })
        return editor.runAction('toggle-paragraph', Path.next(path))
      }
    }
  },
})

export default HeadingNode
