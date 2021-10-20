import { remarkToSlate, slateToRemark } from 'remark-slate-transformer'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { Descendant } from 'slate'
import remarkParse from 'remark-parse'

const se = unified().use(slateToRemark).use(remarkGfm).use(remarkStringify, {
  emphasis: '*',
  strong: '*',
  listItemIndent: 'one',
  fence: '`',
  bullet: '-',
}).freeze()

const de = unified().use(remarkParse).use(remarkGfm).use(remarkToSlate).freeze()

export function transformMarkdown (fragment: Descendant[]): string {
  return se.stringify(se.runSync({
    type: 'root',
    children: fragment,
  } as never))
}

export function parseMarkdown (value: string): Descendant[] {
  return de.processSync(value).result as Descendant[]
}
