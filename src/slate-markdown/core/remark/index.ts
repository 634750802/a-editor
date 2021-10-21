import { Plugin, Processor, unified } from 'unified'
import { remarkToSlate, slateToRemark } from 'remark-slate-transformer'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { Descendant, Node, Transforms } from 'slate'
import rfdc from 'rfdc'
import { override } from '@/utils/override'
import { MdastContentType } from '@/slate-markdown/core/elements'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const clone = rfdc({ proto: false, circles: false })

declare module '../../../slate-markdown/core/editor-factory' {
  interface EditorFactory {
    freezeProcessors: () => void
    configProcessor: (...plugins: Plugin[]) => void
    configSerializeProcessor: (...plugins: Plugin[]) => void
    configDeserializeProcessor: (...plugins: Plugin[]) => void
    generateMarkdown: (fragment: Descendant[]) => string
    generateHtml: (fragment: Descendant[]) => string
    parseMarkdown: (value: string) => Descendant[]
    parseHtml: (value: string) => Descendant[]
  }
}

export function coreRemarkPlugin (factory: EditorFactory): void {
  const serializerPlugins: Plugin[] = []
  const deserializerPlugins: Plugin[] = []

  const serializeProcessor: Processor = unified()
  const serializeHTMLProcessor: Processor = unified()
  const deserializeProcessor: Processor = unified()
  const deserializeHTMLProcessor: Processor = unified()

  factory.freezeProcessors = () => {
    serializeProcessor.use(serializerPlugins).use(slateToRemark).use(remarkGfm).use(remarkStringify, {
      emphasis: '*',
      strong: '*',
      listItemIndent: 'one',
      fence: '`',
      bullet: '-',
    }).freeze()
    serializeHTMLProcessor.use(serializerPlugins).use(slateToRemark).use(remarkGfm).use(remarkRehype).use(rehypeStringify).freeze()
    deserializeProcessor.use(remarkParse).use(remarkGfm).use(remarkToSlate).use(deserializerPlugins).freeze()
    deserializeHTMLProcessor.use(rehypeParse).use(rehypeRemark).use(remarkGfm).use(remarkToSlate).use(deserializerPlugins).freeze()
  }

  factory.configProcessor = (...plugins) => {
    factory.configSerializeProcessor(...plugins)
    factory.configDeserializeProcessor(...plugins)
  }

  factory.configSerializeProcessor = (...plugins: Plugin []) => {
    serializerPlugins.push(...plugins)
  }

  factory.configDeserializeProcessor = (...plugins: Plugin[]) => {
    deserializerPlugins.push(...plugins)
  }

  factory.generateMarkdown = (fragment: Descendant[]): string => {
    return serializeProcessor.stringify(serializeProcessor.runSync({
      type: 'root',
      children: clone(fragment), // processors may change the ast.
    } as never)) as string
  }

  factory.generateHtml = (fragment: Descendant[]): string => {
    return serializeHTMLProcessor.stringify(serializeHTMLProcessor.runSync({
      type: 'root',
      children: clone(fragment), // processors may change the ast.
    } as never)) as string
  }

  factory.parseMarkdown = (value: string): Descendant[] => {
    return deserializeProcessor.processSync(value).result as Descendant[]
  }

  factory.parseHtml = (value: string): Descendant[] => {
    return deserializeHTMLProcessor.processSync(value).result as Descendant[]
  }

  override(factory, 'createDefaultEditableProps', createDefaultEditableProps => {
    return editor => {
      return override(createDefaultEditableProps(editor), 'onPaste', onPaste => {
         return event => {
           const dt = event.clipboardData
           if (dt) {
             if (dt.types.indexOf('application/x-slate-fragment') < 0) {
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
      return fragment => {
        if (editor.selection) {
          const el = Node.parent(editor, editor.selection.anchor.path)
          const cmt = editor.getContentModelType(el)
          if (cmt === MdastContentType.value) {
            Transforms.insertText(editor, factory.generateMarkdown(fragment as Descendant[]))
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
        dt.setData('text/plain', factory.generateMarkdown(editor.getFragment()))
      }
    })
  })

}
