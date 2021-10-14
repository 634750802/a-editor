/* eslint-disable react/jsx-one-expression-per-line */
import { defineNode, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Editor, Element, Location, Node, Path, Range, Text, Transforms } from 'slate'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faCode, faItalic, faStrikethrough, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { ReactEditor } from 'slate-react'
import { isElementType } from '/src/slate-markdown/slate-utils'

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
    if (node.text === '') {
      const deleting: TextNodeDecorator[] = [TextNodeDecorator.strong, TextNodeDecorator.emphasis, TextNodeDecorator.delete, TextNodeDecorator.inlineCode]
        .filter(decorator => !!node[decorator])
      if (deleting.length > 0) {
        Transforms.unsetNodes(editor, deleting, { at: path })
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
      tips: <>加粗</>,
    },
    {
      key: TextNodeDecorator.emphasis,
      icon: faItalic,
      tips: <>斜体</>,
    },
    {
      key: TextNodeDecorator.inlineCode,
      icon: faCode,
      tips: <>行内代码</>,
    },
    {
      key: TextNodeDecorator.delete,
      icon: faStrikethrough,
      tips: <>删除</>,
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

type NodePredicate<E> = (element: E) => boolean

export function isElementActive<E extends Element> (editor: Editor, location: Location, type: E['type'], matcher?: NodePredicate<E>): boolean {
  if (Path.isPath(location)) {
    const n = Node.get(editor, location)
    return isElementType<E>(n, type) && (matcher ? matcher(n) : true)
  }
  const [match] = Editor.nodes(editor, {
    at: Range.isRange(location) ? Editor.unhangRange(editor, location) : location,
    match: n => !Editor.isEditor(n) && isElementType<E>(n, type) && (matcher ? matcher(n) : true),
  })

  return !!match
}

export default TextNode
