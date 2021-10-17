import { defineNode, MdastContentType, RemarkElementToggleParams, ToolbarItemConfig, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { List, ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Path, Transforms } from 'slate'
import { isElementType, previousSiblingLastChildPath } from '/src/slate-markdown/slate-utils'
import React from 'react'
import { isElementActive } from '/src/slate-markdown/elements/text/TextNode'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faListOl, faListUl } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

library.add(faListOl, faListUl)

const ListNode = defineNode<List>({
  type: 'list',
  isLeaf: false,
  isInline: false,
  isVoid: false,
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
        if (prev.ordered === node.ordered && prev.spread === node.spread && prev.start === undefined) {
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
    indent: indentList,
    toggle: toggleList,
    onTrigger: (prefix: string): RemarkElementToggleParams<List> | undefined => {
      if (prefix === '-') {
        return {
          ordered: false,
          start: undefined,
          spread: undefined,
        }
      } else {
        return {
          ordered: true,
          start: parseInt(prefix),
          spread: undefined,
        }
      }
    },
  },
  events: {},
  toolbarItems: [true, false].map(ordered => {
    const isListActive: ToolbarItemConfig<Path>['isActive'] = (editor, path) => path.length > 2 && isElementActive<List>(editor, Path.parent(Path.parent(path)), 'list', list => list.ordered === ordered)
    return {
      key: `list-${ordered ? 'ordered' : 'unordered'}`,
      // eslint-disable-next-line react/jsx-one-expression-per-line
      icon: <FontAwesomeIcon icon={ordered ? faListOl : faListUl} />,
      isActive: isListActive,
      isDisabled: (editor, range) => !isElementType(Node.get(editor, range), ['paragraph', 'heading', 'listItem']),
      action: (editor, path, event) => {
        if (isListActive(editor, path)) {
          toggleList(editor, path, false)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          toggleList(editor, path, { ordered, start: undefined, spread: undefined })
        }
      },
    }
  }),
})

export function indentList (editor: Editor, path: Path, delta: 1 | -1): void {
  if (delta < 0) {
    return toggleList(editor, path, false)
  } else {
    const parentPath = Path.parent(path)
    const parent = Node.get(editor, parentPath)
    if (isElementType<ListItem>(parent, 'listItem')) {
      if (Path.hasPrevious(parentPath)) {
        const grandParent = Node.parent(editor, parentPath) as List
        const newPath = previousSiblingLastChildPath(editor, parentPath)
        Transforms.moveNodes(editor, { at: parentPath, to: newPath })
        Transforms.wrapNodes(editor, {
          type: 'list',
          children: [],
          ordered: grandParent.ordered,
          start: undefined,
          spread: undefined,
        }, {
          at: newPath,
        })
      }
    }
  }
}

export function toggleList (editor: Editor, path: Path, params: RemarkElementToggleParams<List>): void {
  // node must be paragraph
  if (!isElementType(Node.get(editor, path), ['paragraph', 'heading'])) {
    throw new Error('can only call ListNode.toggle on a paragraph or heading node.')
  }
  if (params === false) {
    const fromPath = Path.parent(path) // li
    const toPath = Path.next(Path.parent(fromPath))
    Transforms.splitNodes(editor, { at: fromPath })
    Transforms.moveNodes(editor, { at: toPath.concat(0), to: toPath })
    Transforms.unwrapNodes(editor, { at: toPath })
    Transforms.select(editor, { path: toPath, offset: 0 })
  } else {
    const parentPath = Path.parent(path)
    const parent = Node.get(editor, parentPath)
    // inside a list
    if (isElementType<ListItem>(parent, 'listItem')) {
      Transforms.setNodes(editor, {
        type: 'list',
        ...params,
      }, {
        at: Path.parent(parentPath),
      })
    } else {
      Transforms.wrapNodes(editor, {
        type: 'listItem',
        checked: undefined,
        spread: params.spread,
        children: [],
      }, {
        at: path,
      })
      Transforms.wrapNodes(editor, {
        type: 'list',
        children: [],
        ...params,
      }, {
        at: path,
      })
    }
  }
}

export default ListNode
