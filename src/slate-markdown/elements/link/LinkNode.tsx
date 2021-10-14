import { defineNode, ICustomInlineElementConfig, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Link } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Point, Transforms } from 'slate'
import React from 'react'
import createUrlRegExp from 'url-regex-safe'


export default defineNode<Link>({
  type: 'link',
  isInline: true,
  isVoid: false,
  isLeaf: false,
  normalize: (editor, element, path, preventDefaults) => {
    if (Node.string(element).trim().length === 0) {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
    }
  },
  render: (editor: Editor, { element, attributes, children }: TypedRenderElementProps<Link>): JSX.Element => {
    return (
      <a
        href={element.url}
        onClick={() => window.open(element.url, '_blank')}
        style={{ display: 'inline-flex', cursor: 'pointer' }}
        {...attributes}
      >
         {children}
      </a>
    )
  },
  insert: (editor, location, params: RemarkElementProps<Link>) => {
    Transforms.insertNodes(editor, [
      {
        type: 'link', children: [{
          text: params.url,
        }], ...params,
      },
      { text: ' ' },
    ], { at: location, select: true })
    if (Point.isPoint(location)) {
      Transforms.move(editor, { distance: 1 })
    }
  },
  match: {
    regexp: createUrlRegExp(),
  },
} as Omit<ICustomInlineElementConfig<Link>, 'register'>)
