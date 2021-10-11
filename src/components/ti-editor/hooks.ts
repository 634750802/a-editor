import { Descendant, Editor } from 'slate'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { Processor, unified } from 'unified'
import { remarkToSlate, slateToRemark } from 'remark-slate-transformer'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import { Root } from 'remark-slate-transformer/lib/models/mdast'
import remarkGfm from 'remark-gfm'


export class TiCommunityEditorInstance {
  private getMarkdownProcessor = unified().use(slateToRemark).use(remarkStringify, {
    bullet: '-',
    listItemIndent: 'one',
    fence: '`',
    rule: '-'
  }) as Processor<{ type: 'root', children: Descendant[] }, void, Root, string>
  private setMarkdownProcessor = unified().use(remarkGfm).use(remarkParse).use(remarkToSlate) as Processor<Root, Root, Root, Descendant[]>

  constructor (readonly editor: Editor, private readonly setValue: (desc: Descendant[]) => void) {
    this.getMarkdownProcessor.freeze()
    this.setMarkdownProcessor.freeze()
  }

  get markdown (): string {
    return this.getMarkdownProcessor.stringify(this.getMarkdownProcessor.runSync({
      type: 'root',
      children: this.editor.children,
    }))
  }

  set markdown (text: string) {
    this.setValue(this.setMarkdownProcessor.processSync(text).result)
    setTimeout(() => {
      Editor.normalize(this.editor, { force: true })
    }, 0)
  }
}

export function useInstance (editor: Editor): [TiCommunityEditorInstance, Descendant[], Dispatch<SetStateAction<Descendant[]>>] {
  const [value, setValue] = useState<Descendant[]>([{
    type: 'paragraph',
    children: [{
      text: '',
    }],
  }])
  const instance = useMemo(() => new TiCommunityEditorInstance(editor, setValue), [editor])
  return [instance, value, setValue]
}

