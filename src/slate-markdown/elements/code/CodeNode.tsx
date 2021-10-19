import { defineNode, MdastContentType, TypedRenderElementProps } from '@/slate-markdown/core/elements'
import { Code } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import React, { ChangeEvent } from 'react'
import LineWrapper from '@/components/line-wrapper/LineWrapper'
import { Range, Text, Transforms } from 'slate'
import Prism, { Token } from 'prismjs'
import 'prismjs/components/prism-markdown.js'
import 'prismjs/components/prism-javascript.js'
import 'prismjs/components/prism-typescript.js'
import 'prismjs/components/prism-sql.js'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-go.js'
import 'prismjs/components/prism-rust.js'
import 'prismjs/components/prism-jsx.js'
import 'prismjs/components/prism-tsx.js'
import 'prismjs/components/prism-json.js'
import 'prismjs/components/prism-log.js'
import classNames from 'classnames'
import Tippy from '@tippyjs/react'
import './style.less'
import { useReadOnly } from 'slate-react'

const options = [
  'markdown',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'sql',
  'bash',
  'go',
  'rust',
  'json',
  'log',
]

export const SYMBOL_PRISM_TOKEN = Symbol('prism_token')

const renderCode = ({ attributes, element, children }: TypedRenderElementProps<Code>, active: boolean) => {
  return (
    <pre
      {...attributes}
      className={classNames({ active }, element.lang ? `language-${element.lang}` : undefined)}
    >
      <code className="prism-code">
        {children}
      </code>
    </pre>
  )
}

const CodeNode = defineNode<Code>({
  type: 'code',
  isInline: false,
  isLeaf: false,
  wrappingParagraph: false,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.value,
  render: (editor, props) => {
    const { element } = props
    const readonly = useReadOnly()

    if (readonly) {
      return renderCode(props, false)
    }

    return (
      <LineWrapper element={element}>
        {({ active, pathRef }) => (
          <Tippy
            appendTo={document.body}
            content={(
              <select
                className="lang-selector"
                contentEditable={false}
                /* eslint-disable-next-line react/jsx-no-bind */
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  if (pathRef?.current) {
                    Transforms.setNodes(editor, { lang: e.currentTarget.value }, { at: pathRef.current })
                  }
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
            {renderCode(props, active)}
          </Tippy>

        )}
      </LineWrapper>
    )
  },
  toggle: {
    // TODO: do we needs to support meta?
    prefix: /^`{3}(?: (\w+))?$/,
    toggle: (editor, path, params) => {
      return editor.runAction('toggle-codeblock', path)
    },
    onTrigger: (prefix, editor, path) => {
      if (path.length > 1) {
        return undefined
      }
      const matched = /^`{3}(?: (\w+))?$/.exec(prefix)
      if (matched) {
        return { lang: matched[1] || 'markdown', meta: undefined }
      } else {
        return { lang: 'markdown', meta: undefined }
      }
    },
  },
  events: {},
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
