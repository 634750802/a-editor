import { defineNode, MdastContentType, RemarkElementToggleParams, TypedRenderElementProps } from '@/slate-markdown/core/elements'
import { List } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Path, Transforms } from 'slate'
import { isElementType } from '@/slate-markdown/slate-utils'
import React from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faListOl, faListUl } from '@fortawesome/free-solid-svg-icons'

library.add(faListOl, faListUl)

const ListNode = defineNode<List>({
  type: 'list',
  isLeaf: false,
  isInline: false,
  wrappingParagraph: true, // only for trigger; do not add block event handlers. add them in list item.
  contentType: MdastContentType.flow,
  contentModelType: MdastContentType.list,
  normalize: (editor, node, path, preventDefaults) => {
    if (node.children.length === 0) {
      Transforms.removeNodes(editor, { at: path })
      preventDefaults()
      return
    }
    if (Path.hasPrevious(path)) {
      const prev = Node.get(editor, Path.previous(path))
      if (isElementType<List>(prev, 'list')) {
        if (Boolean(prev.ordered) === Boolean(node.ordered) && prev.start === undefined && node.start === undefined) {
          Transforms.mergeNodes(editor, { at: path })
          preventDefaults()
          return
        }
      }
    }
  },
  render (editor: Editor, { element, attributes, children }: TypedRenderElementProps<List>): JSX.Element {
    if (element.ordered) {
      return (
        <ol
          {...attributes}
          start={element.start}
        >
          {children}
        </ol>
      )
    } else {
      return (
        <ul {...attributes}>
          {children}
        </ul>
      )
    }
  },
  toggle: {
    prefix: /^(?:-|\d+\.)$/,
    toggle: (editor, path, params) => {
      if (params === false) {
        throw new Error('should never reach')
      } else {
        let res: boolean
        editor.runActionParams = params
        if (editor.nearest([Node.get(editor, path), path], ListNode)) {
          res = editor.runAction('indent-list', path)
        } else {
          res = editor.runAction(`toggle-${params.ordered ? 'ordered' : 'unordered'}-list`, path)
        }
        editor.runActionParams = undefined
        return res
      }
    },
    onTrigger: (prefix: string): RemarkElementToggleParams<List> | undefined => {
      if (prefix === '-') {
        return {
          ordered: false,
          start: undefined,
          spread: undefined,
        }
      } else {
        const start = parseInt(prefix)
        return {
          ordered: true,
          start: start === 1 ? undefined : start,
          spread: undefined,
        }
      }
    },
  },
  events: {},
})

export default ListNode
