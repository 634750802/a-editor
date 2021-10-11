import { defineNode, ICustomInlineElementConfig, RemarkElementProps, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Transforms } from 'slate'
import React from 'react'

export default defineNode<Image>({
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
} as ICustomInlineElementConfig<Image>)
