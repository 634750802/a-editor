import { defineNode, ICustomInlineElementConfig, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Element, Path, Transforms } from 'slate'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'
import { isElementActive, isRangeCustomTextPropsEnabled } from '/src/slate-markdown/elements/text/TextNode'
import { requireFields } from '/src/components/form'
import createSchema from './create-schema.json'
import { JSONSchema7 } from 'json-schema'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faImage)

const ImageNode = defineNode<Image>({
  type: 'image',
  isInline: true,
  isVoid: false,
  isLeaf: false,
  render: (editor: Editor, { element, attributes }: TypedRenderElementProps<Image>): JSX.Element => {
    return (
      <img
        alt={element.alt}
        src={element.url}
        title={element.title}
        {...attributes}
      />
    )
  },
  insert: (editor, location, params: RemarkElementProps<Image>) => {
    Transforms.insertNodes(editor, [
      { text: ' ' },
      { type: 'image', children: [], ...params },
      { text: ' ' },
    ], { at: location })
  },
  toolbarItems: [{
    key: 'image',
    icon: <FontAwesomeIcon icon={faImage} />,
    // eslint-disable-next-line react/jsx-one-expression-per-line
    tips: <>超链接</>,
    isActive: (editor, range) => isElementActive(editor, range, 'image'),
    isDisabled: (editor, range) => !Path.equals(Path.parent(range.focus.path), Path.parent(range.anchor.path)) || !isRangeCustomTextPropsEnabled(editor, range),
    action: (editor, range, event) => {
      if (isElementActive(editor, range, 'image')) {
        Transforms.removeNodes(editor, {
          at: Editor.unhangRange(editor, range),
          match: n =>
            !Editor.isEditor(n) && Element.isElement(n) && n.type === 'image',
        })
      } else {
        requireFields<{ src: string, alt: string }>(editor, event.target as HTMLElement, createSchema as JSONSchema7, {
          alt: Editor.string(editor, range),
          src: '',
        })
          .then((data) => {
            if (data) {
              const { src, alt } = data
              Editor.withoutNormalizing(editor, () => {
                ImageNode.insert(editor, range, { url: src, title: '', alt })
              })
            }
          })
      }
    },
  }],
} as Omit<ICustomInlineElementConfig<Image, Record<string, unknown>>, 'register'>)

export default ImageNode
