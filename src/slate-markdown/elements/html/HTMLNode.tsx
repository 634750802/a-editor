/* eslint-disable react/no-danger */
import { defineNode, MdastContentType, TypedRenderElementProps } from '@/slate-markdown/core/elements'
import { Editor } from 'slate'
import { Html } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import VoidElement from '@/components/void-element/void-element'

export default defineNode<Html>({
  type: 'html',
  isLeaf: false,
  isInline: false,
  isEditable: false,
  contentType: MdastContentType.staticPhrasing,
  contentModelType: MdastContentType.value,
  wrappingParagraph: false,
  toggle: {},
  events: {},
  render (editor: Editor, props: TypedRenderElementProps<Html>): JSX.Element {
    const { attributes, element, children } = props
    return (
      <VoidElement attributes={attributes}>
        <span dangerouslySetInnerHTML={{__html: element.children[0].text }}/>

        <span hidden>
          {children}
        </span>
      </VoidElement>
    )
  }
})
