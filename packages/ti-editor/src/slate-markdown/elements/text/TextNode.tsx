/* eslint-disable react/jsx-one-expression-per-line */
import { defineNode, isContentTypeConforms, MdastContentType, RemarkText, TypedRenderLeafProps } from '../../core/elements'
import { Editor, Element, Location, Node, Path, Range, Text, Transforms } from 'slate'
import React from 'react'
import { ReactEditor } from 'slate-react'
import { isElementType } from '../../slate-utils'
import { SYMBOL_PRISM_TOKEN } from '../code/CodeNode'
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
    } if (node.inlineCode) {
      const deleting = [TextNodeDecorator.strong, TextNodeDecorator.emphasis, TextNodeDecorator.delete].filter(decorator => !!node[decorator])
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
          // accroding to mdast, inlineCode cannot have formatted content.
          if (decorator === TextNodeDecorator.inlineCode) {
            Editor.addMark(editor, TextNodeDecorator.inlineCode, false)
            Editor.addMark(editor, TextNodeDecorator.emphasis, false)
            Editor.addMark(editor, TextNodeDecorator.delete, false)
          } else {
            Editor.addMark(editor, TextNodeDecorator.inlineCode, false)
          }
        }
      } else {
        Transforms.setNodes(editor, { [decorator]: true }, { match: nodeMatch, split: true })
        if (decorator === TextNodeDecorator.inlineCode) {
          Transforms.unsetNodes(editor, [TextNodeDecorator.delete, TextNodeDecorator.emphasis, TextNodeDecorator.strong], { match: nodeMatch, split: true })
        } else {
          Transforms.unsetNodes(editor, TextNodeDecorator.inlineCode, { match: nodeMatch, split: true })
        }
      }
    }
  }
})

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

export const isRangeEditable = (editor: Editor, range: Range) => {
  const [node] = Editor.nodes(editor, { at: range, match: node => !editor.isEditable(node) } )
  return !node
}

export const isRangeCustomTextPropsEnabled = (editor: Editor, range: Range) => {
  const match = isPhrasing(editor)
  const [nodes] = Editor.nodes(editor, { at: range, match })
  return !!nodes
}

export const isCustomTextPropsEnabled = (editor: Editor): NodeMatch<Node> => (node, path) => {
  const match = isPhrasing(editor)
  if (!Text.isText(node)) {
    return false
  }
  const parentNode = Node.parent(editor, path)
  if (Element.isElement(parentNode)) {
    return match(parentNode, Path.parent(path))
  } else {
    return false
  }
}

export const isPhrasing = (editor: Editor): NodeMatch<Node> => (node, path) => {
  if (Element.isElement(node)) {
    const config = editor.factory.customElementMap.get(node.type)
    if (!config) {
      return false
    }
    return config.contentModelType ? isContentTypeConforms(config.contentModelType, MdastContentType.phrasing) : false
  } else {
    return false
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
