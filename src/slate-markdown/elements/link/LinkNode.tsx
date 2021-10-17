import { defineNode, ICustomInlineElementConfig, MdastContentType, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Link } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Element, Location, Node, Path, Point, Transforms } from 'slate'
import React from 'react'
import createUrlRegExp from 'url-regex-safe'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { isElementActive, isRangeCustomTextPropsEnabled } from '/src/slate-markdown/elements/text/TextNode'
import { requireFields } from '/src/components/form'
import createSchema from './create-schema.json'
import { JSONSchema7 } from 'json-schema'

library.add(faLink)

const LinkNode = defineNode({
  type: 'link',
  isInline: true,
  isVoid: false,
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
  toolbarItems: [
    {
      key: 'link',
      icon: <FontAwesomeIcon icon={faLink} />,
      // eslint-disable-next-line react/jsx-one-expression-per-line
      tips: <>超链接</>,
      isActive: (editor, range) => isElementActive(editor, range, 'link'),
      isDisabled: (editor, range) => !Path.equals(Path.parent(range.focus.path), Path.parent(range.anchor.path)) || !isRangeCustomTextPropsEnabled(editor, range),
      action: (editor, range, event) => {
        if (isElementActive(editor, range, 'link')) {
          Transforms.unwrapNodes(editor, {
            at: Editor.unhangRange(editor, range),
            match: n =>
              !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
          })
        } else {
          requireFields<{ src: string, text: string }>(editor, event.target as HTMLElement, createSchema as JSONSchema7, {
            text: Editor.string(editor, range),
            src: '',
          })
            .then((data) => {
              if (data) {
                const { src, text } = data
                Editor.withoutNormalizing(editor, () => {
                  LinkNode.insert(editor, range, { url: src, title: '', text })
                })
              }
            })
        }
      },
    },
  ],
} as Omit<ICustomInlineElementConfig<Link, { text: string }>, 'register'>)

export default LinkNode
