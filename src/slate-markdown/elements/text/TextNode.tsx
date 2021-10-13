/* eslint-disable react/jsx-one-expression-per-line */
import { defineNode, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Editor, Node, Range, Text, Transforms } from 'slate'
import React from 'react'

export const enum TextNodeDecorator {
  strong = 'strong',
  emphasis = 'emphasis',
  delete = 'delete',
  inlineCode = 'inlineCode'
}

interface TextApi {
  toggleDecorator: (editor: Editor, decorator: TextNodeDecorator) => void
}

export default defineNode<RemarkText, TextApi>({
  isLeaf: true,
  render (editor: Editor, { text, children, attributes }: TypedRenderLeafProps<RemarkText>): JSX.Element {
    let el = children
    if (text.delete) {
      el = <del>{el}</del>
    }
    if (text.emphasis) {
      el = <em>{el}</em>
    }
    if (text.strong) {
      el = <strong>{el}</strong>
    }
    if (text.inlineCode) {
      el = <code>{el}</code>
    }
    return (
      <span {...attributes}>
        {el}
      </span>
    )
  },
  toggleDecorator (editor: Editor, decorator: TextNodeDecorator) {
    if (!editor.selection) {
      return
    }
    if (isDecoratorActive(editor, decorator)) {
      if (Range.isCollapsed(editor.selection)) {
        Editor.addMark(editor, decorator, false)
      } else {
        Transforms.setNodes(editor, { [decorator]: false }, { match: Text.isText, split: true })
      }
    } else {
      if (Range.isCollapsed(editor.selection)) {
        Editor.addMark(editor, decorator, true)
      } else {
        Transforms.setNodes(editor, { [decorator]: true }, { match: Text.isText, split: true })
      }
    }
  },
})

function isDecoratorActive (editor: Editor, decorator: TextNodeDecorator) {
  const { selection } = editor
  if (!selection) return false

  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: n => !Editor.isEditor(n) && Text.isText(n) && !!n[decorator],
  })

  return !!match
}


