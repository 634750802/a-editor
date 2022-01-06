import { EditorFactory } from '../../slate-markdown/core/editor-factory'
import { Editor } from 'slate'
import { createElement } from 'react'
import el from './register-element'
import './style.less'


export type Rule = {
  test: RegExp | ((val: string) => boolean)
  render: (editor: Editor, link: string) => JSX.Element
}

export type LinkBlockPluginOptions = {
  rules: Rule[]
}

declare module '../../slate-markdown/core/editor-factory' {
  interface EditorFactory {
    renderLinkBlock: (editor: Editor, link: string) => JSX.Element
  }
}

function test (rule: Rule, link: string): boolean {
  if (typeof rule.test === 'function') {
    return rule.test(link)
  } else {
    return rule.test.test(link)
  }
}

export default function linkBlockPlugin (options: LinkBlockPluginOptions): (factory: EditorFactory) => void {
  return factory => {
    el.register(factory)

    factory.renderLinkBlock = (editor, link) => {
      for (const rule of options.rules) {
        if (test(rule, link)) {
          return rule.render(editor, link)
        }
      }

      return createElement('a', { href: link }, [link])
    }
  }
}
