import { defineNode, ICustomInlineElementConfig, MdastContentType, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Link } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Location, Node, Point, Transforms } from 'slate'
import React from 'react'
import createUrlRegExp from 'url-regex-safe'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faLink)

const LinkNode = defineNode({
  type: 'link',
  isInline: true,
  isLeaf: false,
  contentType: MdastContentType.phrasing,
  contentModelType: MdastContentType.staticPhrasing,
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
  insert: ((editor: Editor, location: Location, { text, ...params }: RemarkElementProps<Link & { text: string }>) => {
    Transforms.insertNodes(editor, [
      {
        type: 'link', children: [{
          text: text,
        }], ...params,
      },
      { text: ' ' },
    ], { at: location, select: true })
    if (Point.isPoint(location)) {
      Transforms.move(editor, { distance: 1 })
    }
  }) as never,
  match: {
    regexp: createUrlRegExp(),
  },
} as Omit<ICustomInlineElementConfig<Link, { text: string }>, 'register'>)

export default LinkNode
