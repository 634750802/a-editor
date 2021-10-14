import { defineNode, ICustomInlineElementConfig, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Link } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Element, Node, Point, Transforms } from 'slate'
import React from 'react'
import createUrlRegExp from 'url-regex-safe'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { isElementActive } from '/src/slate-markdown/elements/text/TextNode'

library.add(faLink)

const LinkNode = defineNode<Link>({
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
  toolbarItems: [
    {
      key: 'link',
      icon: <FontAwesomeIcon icon={faLink} />,
      // eslint-disable-next-line react/jsx-one-expression-per-line
      tips: <>超链接</>,
      isActive: (editor, range) => isElementActive(editor, range, 'link'),
      isDisabled: () => false,
      action: (editor, range, event) => {
        if (isElementActive(editor, range, 'link')) {
          Transforms.unwrapNodes(editor, {
            at: Editor.unhangRange(editor, range),
            match: n =>
              !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
          })
        } else {
          alert('TODO: ')
        }
      },
    },
  ],
} as Omit<ICustomInlineElementConfig<Link>, 'register'>)

export default LinkNode
