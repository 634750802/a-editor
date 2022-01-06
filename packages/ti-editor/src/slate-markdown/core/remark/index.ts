import { EditorFactory } from '../editor-factory'
import { Descendant, Node, Transforms } from 'slate'
import { override } from '../../../utils/override'
import { MdastContentType } from '../elements'
import { TiRemark, withTiRemark } from '@pingcap-inc/tidb-community-remark'

declare module '../editor-factory' {
  interface EditorFactory extends TiRemark {
  }
}

export function coreRemarkPlugin (factory: EditorFactory): void {
  factory = withTiRemark(factory)

  let __tempPlainText = ''

  override(factory, 'createDefaultEditableProps', createDefaultEditableProps => {
    return editor => {
      return override(createDefaultEditableProps(editor), 'onPaste', onPaste => {
        return event => {
          const dt = event.clipboardData
          if (dt) {
            if (dt.types.indexOf('application/x-slate-fragment') < 0) {
              if (dt.types.indexOf('text/plain') >= 0) {
                __tempPlainText = dt.getData('text/plain')
              }
              if (dt.types.indexOf('text/html') >= 0) {
                const htmlData = dt.getData('text/html')
                const nodes = factory.parseHtml(htmlData)
                editor.insertFragment(nodes)
                event.preventDefault()
                return
              } else if (dt.types.indexOf('text/plain') >= 0) {
                const textData = dt.getData('text/plain')
                const nodes = factory.parseMarkdown(textData)
                editor.insertFragment(nodes)
                event.preventDefault()
                return
              }
            }
          }
          onPaste?.(event)
        }
      })
    }
  })

  factory.onWrapEditor(editor => {
    override(editor, 'insertFragment', insertFragment => {
      return (fragment) => {
        if (editor.selection) {
          const el = Node.parent(editor, editor.selection.anchor.path)
          const cmt = editor.getContentModelType(el)
          if (cmt === MdastContentType.value) {
            if (__tempPlainText) {
              Transforms.insertText(editor, __tempPlainText)
            } else {
              Transforms.insertText(editor, factory.generateMarkdown(fragment as Descendant[]))
            }
            return
          }
        }
        insertFragment(fragment)
      }
    })

    override(editor, 'setFragmentData', setFragmentData => {
      return (dt) => {
        setFragmentData(dt)
        // copy the markdown content
        const fragment = editor.getFragment()
        dt.setData('text/plain', factory.generateMarkdown(fragment))
        __tempPlainText = fragment.map(Node.string).join('\n')
      }
    })
  })

}
