import { defineNode, RemarkElementToggleParams, TypedRenderElementProps } from '/src/slate-markdown/core/elements'
import { List, ListItem } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { Editor, Node, Path, Transforms } from 'slate'
import { isElementType, previousSiblingLastChildPath } from '/src/slate-markdown/slate-utils'

const ListNode = defineNode<List>({
  type: 'list',
  isLeaf: false,
  isInline: false,
  isVoid: false,
  wrappingParagraph: true, // only for trigger; do not add block event handlers. add them in list item.
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
    prefix: /^-|\d+\.$/,
    toggle: (editor, path, params) => {
      // node must be paragraph
      if (!isElementType(Node.get(editor, path), 'paragraph')) {
        throw new Error('can only call ListNode.toggle on a paragraph node.')
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
          if (Path.hasPrevious(parentPath)) {
            const newPath = previousSiblingLastChildPath(editor, parentPath)
            Transforms.moveNodes(editor, { at: parentPath, to: newPath })
            Transforms.wrapNodes(editor, {
              type: 'list',
              children: [],
              ...params,
            }, {
              at: newPath,
            })
          }
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
    },
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
})

export default ListNode
