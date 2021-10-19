import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import { ActionType } from '/src/slate-markdown/core/actions'
import { Node, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import { isContentTypeConforms } from '/src/slate-markdown/core/elements'
import CodeNode from '/src/slate-markdown/elements/code/CodeNode'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode } from '@fortawesome/free-solid-svg-icons'

export function register (factory: EditorFactory) {
  factory.defineAction({
    key: 'toggle-codeblock',
    type: ActionType.phrasing,
    icon: <FontAwesomeIcon icon={faCode} />,
    computeState: (editor, path) => {
      const node = Node.get(editor, path)
      const active = isElementType(node, 'code')
      let disabled: boolean
      if (active) {
        disabled = false
      } else {
        const parent = Node.parent(editor, path)
        const parentContentModelType = editor.getContentModelType(parent)
        if (!parentContentModelType) {
          disabled = true
        } else {
          disabled = !isContentTypeConforms(CodeNode.contentType, parentContentModelType)
        }
      }
      return { active, disabled }
    },
    action: (editor, path, state) => {
      const node = Node.get(editor, path)
      if (state.active) {
        Transforms.unsetNodes(editor, Object.keys(Node.extractProps(node)), { at: path })
        Transforms.setNodes(editor, { type: 'paragraph' }, { at: path })
      } else {
        const text = Node.string(node)
        Transforms.removeNodes(editor, { at: path })
        Transforms.insertNodes(editor, { type: 'code', lang: 'markdown', meta: undefined, children: [{ text }] }, { at: path, select: true })
      }
      return true
    },
  })
}
