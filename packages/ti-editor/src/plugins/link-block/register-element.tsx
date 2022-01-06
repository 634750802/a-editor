import { CustomBlockElements, defineNode, MdastContentType } from '../../slate-markdown/core/elements'
import { Editor, Path, Transforms } from 'slate'


declare module '../../slate-markdown/core/elements' {
  export interface CustomBlockElements {
    linkBlock: {
      type: 'linkBlock'
      link: string
      children: [{ text: '' }]
    }
  }
}



export default defineNode<CustomBlockElements['linkBlock']>({
  type: 'linkBlock',
  isLeaf: false,
  isInline: false,
  contentType: MdastContentType.flow,
  contentModelType: null,
  wrappingParagraph: false,
  normalize: ((editor, element, path) => {
    const nextPath = Path.next(path)
    if (!Editor.hasPath(editor, nextPath)) {
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: nextPath })
    }
  }),
  render: (editor, { attributes, children, element }) => {
    const block = editor.factory.renderLinkBlock(editor, element.link)
    return (
      <div
        className="ti-link-block"
        contentEditable={false}
        {...attributes}
      >
        {block}

        {children}
      </div>
    )
  },
  events: {},
  toggle: {},
})
