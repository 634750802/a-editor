import { Editor, Element, Node, Path, Text } from 'slate'

export function isElementType<T extends Exclude<Element, Text>, K extends T['type'] = T['type']> (node: Node, type: K): node is T {
  return Element.isElement(node) && node.type === type
}

export function previousSiblingLastChildPath (editor: Editor, path: Path): Path {
  const siblingPath = Path.previous(path)
  const sibling = Node.get(editor, siblingPath) as Element
  return siblingPath.concat(sibling.children.length)
}
