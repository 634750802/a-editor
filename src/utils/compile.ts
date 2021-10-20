import { slateToRemark } from 'remark-slate-transformer'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { Descendant } from 'slate'

const processor = unified().use(slateToRemark).use(remarkGfm).use(remarkStringify, {
  emphasis: '*',
  strong: '*',
  listItemIndent: 'one',
  fence: '`',
  bullet: '-',
}).freeze()

export function transformMarkdown (fragment: Descendant[]): string {
  return processor.stringify(processor.runSync({
    type: 'root',
    children: fragment
  } as never))
}
