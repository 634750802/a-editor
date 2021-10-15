import { defineNode } from '/src/slate-markdown/core/elements'
import { Code } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import React, { ChangeEvent } from 'react'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import { Node, Range, Text, Transforms } from 'slate'
import Prism, { Token } from 'prismjs'
import 'prismjs/components/prism-markdown.js'
import 'prismjs/components/prism-javascript.js'
import 'prismjs/components/prism-sql.js'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-go.js'
import 'prismjs/components/prism-rust.js'
import 'prism-themes/themes/prism-vs.css'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { isElementActive } from '/src/slate-markdown/elements/text/TextNode'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import Tippy from '@tippyjs/react'

const options = [
  'markdown',
  'javascript',
  'sql',
  'bash',
  'go',
  'rust',
]

export const SYMBOL_PRISM_TOKEN = Symbol('prism_token')

const CodeNode = defineNode<Code>({
  type: 'code',
  isInline: false,
  isLeaf: false,
  isVoid: false,
  isDisallowTextDecorators: true,
  isHiddenHoverToolbar: true,
  wrappingParagraph: false,
  render: (editor, { element, children, attributes }) => {
    return (
      <LineWrapper element={element}>
        {({ active, path }) => (
          <Tippy
            appendTo={document.body}
            content={(
              <select
                className="lang-selector"
                contentEditable={false}
                /* eslint-disable-next-line react/jsx-no-bind */
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  Transforms.setNodes(editor, { lang: e.currentTarget.value }, { at: path })
                }}
                tabIndex={undefined}
                value={element.lang || undefined}
              >
                {options.map(op => (
                  <option key={op}>
                    {op}
                  </option>
                ))}
              </select>
            )}
            interactive
            placement='top-start'
          >
            <pre
              {...attributes}
              className={classNames({ active }, element.lang ? `language-${element.lang}` : undefined)}
            >
              <code className="prism-code">
                {children}
              </code>
            </pre>
          </Tippy>

        )}
      </LineWrapper>
    )
  },
  toggle: {
    // TODO: do we needs to support meta?
    prefix: /^`{3}(?: (\w+))?$/,
    toggle: (editor, path, params) => {
      if (params) {
        const text = Node.string(Node.get(editor, path))
        Transforms.removeNodes(editor, { at: path })
        Transforms.insertNodes(editor, { type: 'code', ...params, children: [{ text }] }, { at: path })
        Transforms.select(editor, path.concat(0))
      } else {
        Transforms.unsetNodes(editor, ['meta', 'lang'] , { at: path })
        Transforms.setNodes(editor, { type: 'paragraph' } , { at: path })
      }
    },
    onTrigger: prefix => {
      const matched = /^`{3}(?: (\w+))?$/.exec(prefix)
      if (matched) {
        return { lang: matched[1] || 'markdown', meta: undefined }
      } else {
        return { lang: 'markdown', meta: undefined }
      }
    },
  },
  events: {},
  toolbarItems: [{
    key: 'code-block',
    icon: <FontAwesomeIcon icon={faCode} />,
    isActive: (editor, range) => isElementActive(editor, range, 'code'),
    isDisabled: (editor, range) => range.length > 1,
    tips: <>
      代码块
          </>,
    action: (editor, range, e) => {
      if (isElementActive(editor, range, 'code')) {
        CodeNode.toggle.toggle(editor, range, false)
      } else {
        CodeNode.toggle.toggle(editor, range, { lang: 'markdown', meta: undefined })
      }
    },
  }],
  // see slate.js official highlighting example
  decorate: (editor, [node, path], el) => {
    if (Text.isText(node) && el.lang) {
      const lang = Prism.languages[el.lang]
      if (!lang) {
        return []
      }
      const ranges: Range[] = []
      const tokens = Prism.tokenize(node.text, lang)
      let start = 0
      for (const token of tokens) {
        const length = getLength(token)
        const end = start + length
        if (typeof token !== 'string') {
          ranges.push({
            [SYMBOL_PRISM_TOKEN]: token.type,
            anchor: { path, offset: start },
            focus: { path, offset: end },
          } as Range)
        }
        start = end
      }
      return ranges
    }
    return []
  },
})


const getLength = (token: string | Token): number => {
  if (typeof token === 'string') {
    return token.length
  } else if (typeof token.content === 'string') {
    return token.content.length
  } else {
    return (token.content as Token[]).reduce((l: number, t: string | Token) => l + getLength(t), 0)
  }
}

export default CodeNode
