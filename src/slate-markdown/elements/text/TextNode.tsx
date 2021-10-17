/* eslint-disable react/jsx-one-expression-per-line */
import { defineNode, ICustomBlockElementConfig, MdastContentType, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Editor, Element, Location, Node, Path, Range, Text, Transforms } from 'slate'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faCode, faItalic, faStrikethrough, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { ReactEditor } from 'slate-react'
import { isElementType } from '/src/slate-markdown/slate-utils'
import { SYMBOL_PRISM_TOKEN } from '/src/slate-markdown/elements/code/CodeNode'
import classNames from 'classnames'
import { NodeMatch } from 'slate/dist/interfaces/editor'

export const enum TextNodeDecorator {
  strong = 'strong',
  emphasis = 'emphasis',
  delete = 'delete',
  inlineCode = 'inlineCode'
}

interface TextApi {
  toggleDecorator: (editor: Editor, range: Range, decorator: TextNodeDecorator) => void
  canContainsContentModelTypeOf: (text: Text) => MdastContentType
}

const TextNode = defineNode<RemarkText, TextApi>({
  isLeaf: true,
  contentType: MdastContentType.staticPhrasing,
  contentModelType: MdastContentType.value,
  canContainsContentModelTypeOf: text => {
    if (text.inlineCode) {
      return MdastContentType.value
    } else if (text.strong || text.emphasis || text.delete) {
      return MdastContentType.phrasing
    } else {
      return MdastContentType.phrasing
    }
  },
  normalize: (editor, node, path, preventDefaults) => {
    if (node.text === '') {
      const deleting: TextNodeDecorator[] = [TextNodeDecorator.strong, TextNodeDecorator.emphasis, TextNodeDecorator.delete, TextNodeDecorator.inlineCode]
        .filter(decorator => !!node[decorator])
      if (deleting.length > 0) {
        Transforms.unsetNodes(editor, deleting, { at: path })
      }
    }
  },
  render (editor: Editor, { leaf, children, attributes }: TypedRenderLeafProps<RemarkText>): JSX.Element {
    let el = children
    if (leaf[SYMBOL_PRISM_TOKEN]) {
      el = <span className={classNames(leaf[SYMBOL_PRISM_TOKEN] ? `token ${leaf[SYMBOL_PRISM_TOKEN]}` : undefined, (attributes as any).className)}>{el}</span>
    }
    if (leaf.delete) {
      el = <del>{el}</del>
    }
    if (leaf.emphasis) {
      el = <em>{el}</em>
    }
    if (leaf.strong) {
      el = <strong>{el}</strong>
    }
    if (leaf.inlineCode) {
      el = <code>{el}</code>
    }
    return (
      <span {...attributes}>
        {el}
      </span>
    )
  },
  toggleDecorator: (editor: Editor, range, decorator: TextNodeDecorator) => {
    const nodeMatch = isCustomTextPropsEnabled(editor)
    const rangeMatch = (range: Range) => nodeMatch(Node.get(editor, range.anchor.path), range.anchor.path)
    if (isDecoratorActive(editor, range, decorator)) {
      if (Range.isCollapsed(range)) {
        if (rangeMatch(range)) {
          Editor.addMark(editor, decorator, false)
        }
      } else {
        Transforms.setNodes(editor, { [decorator]: false }, { match: nodeMatch, split: true })
      }
    } else {
      if (Range.isCollapsed(range)) {
        if (rangeMatch(range)) {
          Editor.addMark(editor, decorator, true)
        }
      } else {
        Transforms.setNodes(editor, { [decorator]: true }, { match: nodeMatch, split: true })
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
    isDisabled: (editor, range) => !isRangeCustomTextPropsEnabled(editor, range),
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

export const isRangeCustomTextPropsEnabled = (editor: Editor, range: Range) => {
  const isNotEnabled = isCustomTextPropsNotEnabled(editor)
  const [nodes] = Editor.nodes(editor, { at: range, match: isNotEnabled})
  return !nodes
}

export const isCustomTextPropsEnabled = (editor: Editor): NodeMatch<Node> => (node, path) => {
  if (!Text.isText(node)) {
    return false
  }
  const parentNode = Node.parent(editor, path)
  if (Element.isElement(parentNode)) {
    const config = editor.factory.customElementMap.get(parentNode.type)
    if (!config) {
      return false
    }
    return !(config as ICustomBlockElementConfig<never>).isDisallowTextDecorators
  } else {
    return false
  }
}

export const isCustomTextPropsNotEnabled = (editor: Editor): NodeMatch<Node> => (node, path) => {
  if (!Text.isText(node)) {
    return false
  }
  const parentNode = Node.parent(editor, path)
  if (Element.isElement(parentNode)) {
    const config = editor.factory.customElementMap.get(parentNode.type)
    if (!config) {
      return true
    }
    return !!(config as ICustomBlockElementConfig<never>).isDisallowTextDecorators
  } else {
    return true
  }
}

type NodePredicate<E> = (element: E) => boolean

export function isElementActive<E extends Element> (editor: Editor, location: Location, type: E['type'], matcher?: NodePredicate<E>): boolean {
  if (Range.isRange(location)) {
    if (!ReactEditor.hasRange(editor, location)) {
      return false
    }
  } else if (Path.isPath(location)) {
    if (!Editor.hasPath(editor, location)) {
      return false
    }
  } else {
    if (!ReactEditor.hasRange(editor, { anchor: location, focus: location })) {
      return false
    }
  }

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
