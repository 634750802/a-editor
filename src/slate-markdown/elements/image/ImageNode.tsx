import { defineNode, ICustomInlineElementConfig, MdastContentType, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Transforms } from 'slate'
import React from 'react'
import { faImage } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import VoidElement from '/src/components/void-element/void-element'

library.add(faImage)

const ImageNode = defineNode<Image>({
  type: 'image',
  isInline: true,
  isLeaf: false,
  contentType: MdastContentType.staticPhrasing,
  contentModelType: null,
  render: (editor: Editor, { element, attributes, children }: TypedRenderElementProps<Image>): JSX.Element => {
    return (
      <VoidElement>
        <img
          alt={element.alt}
          src={element.url}
          title={element.title}
          {...attributes}
        />

        {children}
      </VoidElement>
    )
  },
  insert: (editor, location, params: RemarkElementProps<Image>) => {
    Transforms.insertNodes(editor, [
      { text: ' ' },
      { type: 'image', children: [], ...params },
      { text: ' ' },
    ], { at: location })
  },
  toolbarItems: [],
} as Omit<ICustomInlineElementConfig<Image, Record<string, unknown>>, 'register'>)

export default ImageNode
