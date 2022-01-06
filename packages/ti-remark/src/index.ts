import { Descendant } from 'slate'
import { toString } from 'mdast-util-to-string'
import { Plugin, Processor, unified } from 'unified'
import { remarkToSlate, slateToRemark } from 'remark-slate-transformer'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import rehypeParse from 'rehype-parse'
import rehypeRemoveComments from 'rehype-remove-comments'
import rehypeRemark from 'rehype-remark'
import rfdc from 'rfdc'

export interface TiRemark {
  // configure methods
  freezeProcessors (): void

  configProcessor (...plugins: Plugin[]): void

  configSerializeProcessor (...plugins: Plugin[]): void

  configDeserializeProcessor (...plugins: Plugin[]): void

  // methods
  parseMarkdown (markdown: string): Descendant[]

  generateMarkdown (descendants: Descendant[]): string

  parseHtml (html: string): Descendant[]

  generateHtml (descendants: Descendant[]): string

  generateText (descendants: Descendant[]): string
}

const clone = rfdc({ proto: false, circles: false })

export function withTiRemark<T> (target: T): T & TiRemark {
  const serializerPlugins: Plugin[] = []
  const deserializerPlugins: Plugin[] = []

  const serializeProcessor: Processor = unified()
  const serializeHTMLProcessor: Processor = unified()
  const serializeTextProcessor: Processor = unified()
  const deserializeProcessor: Processor = unified()
  const deserializeHTMLProcessor: Processor = unified()

  const res = target as T & TiRemark


  res.freezeProcessors = () => {
    serializeProcessor.use(serializerPlugins).use(slateToRemark).use(remarkGfm).use(remarkStringify, {
      emphasis: '*',
      strong: '*',
      listItemIndent: 'one',
      fence: '`',
      bullet: '-',
      fences: true,
    }).freeze()
    serializeHTMLProcessor.use(serializerPlugins).use(slateToRemark).use(remarkGfm).use(remarkRehype).use(rehypeStringify).freeze()
    serializeTextProcessor.use(serializerPlugins).use(slateToRemark).use(remarkGfm).freeze()
    deserializeProcessor.use(remarkParse).use(remarkGfm).use(remarkToSlate).use(deserializerPlugins).freeze()
    deserializeHTMLProcessor.use(rehypeParse).use(rehypeRemoveComments, ({ removeConditional: true })).use(rehypeRemark).use(remarkGfm).use(remarkToSlate).use(deserializerPlugins).freeze()
  }

  res.configProcessor = (...plugins) => {
    res.configSerializeProcessor(...plugins)
    res.configDeserializeProcessor(...plugins)
  }

  res.configSerializeProcessor = (...plugins: Plugin []) => {
    serializerPlugins.push(...plugins)
  }

  res.configDeserializeProcessor = (...plugins: Plugin[]) => {
    deserializerPlugins.push(...plugins)
  }

  res.generateMarkdown = (fragment: Descendant[]): string => {
    return serializeProcessor.stringify(serializeProcessor.runSync({
      type: 'root',
      children: clone(fragment), // processors may change the ast.
    } as never)) as string
  }

  res.generateHtml = (fragment: Descendant[]): string => {
    return serializeHTMLProcessor.stringify(serializeHTMLProcessor.runSync({
      type: 'root',
      children: clone(fragment), // processors may change the ast.
    } as never)) as string
  }

  res.parseMarkdown = (value: string): Descendant[] => {
    return deserializeProcessor.processSync(value).result as Descendant[]
  }

  res.parseHtml = (value: string): Descendant[] => {
    return deserializeHTMLProcessor.processSync(value).result as Descendant[]
  }

  res.generateText = (fragment: Descendant[]): string => {
    const ast = serializeTextProcessor.runSync({
      type: 'root',
      children: fragment
    } as never)
    return toString(ast)
  }
  return res
}
