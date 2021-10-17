import { defineNode, isContentTypeConforms, MdastContentType, ToolbarItemConfig } from '/src/slate-markdown/core/elements'
import { Code } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import React, { ChangeEvent } from 'react'
import LineWrapper from '/src/components/line-wrapper/LineWrapper'
import { Editor, Node, Path, Range, Text, Transforms } from 'slate'
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
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import Tippy from '@tippyjs/react'
import './style.less'
import { isElementType } from '/src/slate-markdown/slate-utils'
import ParagraphNode from '/src/slate-markdown/elements/paragraph/ParagraphNode'

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

const toolbarItems: ToolbarItemConfig<Path>[] = [{
  key: 'code-block',
  icon: <FontAwesomeIcon icon={faCode} />,
  isActive: (editor: Editor, path: Path) => isElementType(Node.get(editor, path), 'code'),
  isDisabled: (editor, path) => {
    const node = Node.get(editor, path)
    if (isElementType(node, 'code')) {
      return false
    }
    const parent = Node.parent(editor, path)
    const parentContentModelType = editor.getContentModelType(parent)
    if (!parentContentModelType) {
      return true
    }
    return !isContentTypeConforms(CodeNode.contentType, parentContentModelType)
  },
  tips: (
    <>
      代码块
    </>
  ),
  action: (editor, path, e) => {
    // TODO: remove dirty handles
    const node = Node.get(editor, path)
    if (isElementType(node, 'code')) {
      Transforms.unsetNodes(editor, Object.keys(Node.extractProps(node)), { at: path })
      Transforms.setNodes(editor, { type: 'paragraph' }, { at: path })
    } else {
      const text = Node.string(node)
      Transforms.removeNodes(editor, { at: path })
      Transforms.insertNodes(editor, { type: 'code', lang: 'markdown', meta: undefined, children: [{ text }]}, { at: path, select: true })
    }
  },
}]

const CodeNode = defineNode<Code>({
  type: 'code',
  isInline: false,
  isLeaf: false,
  wrappingParagraph: false,
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.value,
  render: (editor, { element, children, attributes }) => {
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
        Transforms.unsetNodes(editor, ['meta', 'lang'], { at: path })
        Transforms.setNodes(editor, { type: 'paragraph' }, { at: path })
      }
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
  toolbarItems,
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
