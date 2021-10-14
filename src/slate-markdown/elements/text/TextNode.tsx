/* eslint-disable react/jsx-one-expression-per-line */
import { defineNode, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Editor, Node, Path, Range, Text, Transforms } from 'slate'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faCode, faItalic, faStrikethrough, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { ReactEditor } from 'slate-react'
import { isElementType } from '/src/slate-markdown/slate-utils'
import { Link } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'

export const enum TextNodeDecorator {
  strong = 'strong',
  emphasis = 'emphasis',
  delete = 'delete',
  inlineCode = 'inlineCode'
}

interface TextApi {
  toggleDecorator: (editor: Editor, range: Range, decorator: TextNodeDecorator) => void
}

const TextNode = defineNode<RemarkText, TextApi>({
  isLeaf: true,
  normalize: (editor, node, path, preventDefaults) => {
    if (node.text.length === 1 && node.text !== ' ' && Path.hasPrevious(path)) {
      const prev = Node.get(editor, Path.previous(path))
      if (isElementType<Link>(prev, 'link')) {
        const newPos = Path.previous(path).concat(prev.children.length)
        Transforms.moveNodes(editor, { at: path, to: newPos })
        editor.normalizeNode([prev, Path.previous(path)])
        preventDefaults()
      }
    }
  },
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
  toggleDecorator: (editor: Editor, range, decorator: TextNodeDecorator) => {
    if (isDecoratorActive(editor, range, decorator)) {
      if (Range.isCollapsed(range)) {
        Editor.addMark(editor, decorator, false)
      } else {
        Transforms.setNodes(editor, { [decorator]: false }, { match: Text.isText, split: true })
      }
    } else {
      if (Range.isCollapsed(range)) {
        Editor.addMark(editor, decorator, true)
      } else {
        Transforms.setNodes(editor, { [decorator]: true }, { match: Text.isText, split: true })
      }
    }
  },
  toolbarItems: ([
    {
      key: TextNodeDecorator.strong,
      icon: faBold,
      tips: <p>加粗</p>,
    },
    {
      key: TextNodeDecorator.emphasis,
      icon: faItalic,
    },
    {
      key: TextNodeDecorator.inlineCode,
      icon: faCode,
    },
    {
      key: TextNodeDecorator.delete,
      icon: faStrikethrough,
    },
  ] as ToolbarItemConfig[]).map(({ key, icon, tips }) => ({
    key: key,
    icon: <FontAwesomeIcon icon={icon} />,
    isActive: (editor, range) => isDecoratorActive(editor, range, key),
    isDisabled: () => false,
    action: (editor, range, event) => {
      TextNode.toggleDecorator(editor, range, key)
    },
    tips,
  })),
})

type ToolbarItemConfig = {
  key: TextNodeDecorator
  icon: IconDefinition
  tips?: JSX.Element
}

export function isDecoratorActive (editor: Editor, selection: Range, decorator: TextNodeDecorator): boolean {
  if (!ReactEditor.hasRange(editor, selection)) {
    return false
  }

  const marks = Editor.marks(editor)
  if (!marks) {
    return false
  }

  return !!marks[decorator]
}

export default TextNode
