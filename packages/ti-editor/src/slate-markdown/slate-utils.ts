import { Editor, Element, Location, Node, Path, Text } from 'slate'
import { NodeMatch } from 'slate/dist/interfaces/editor'
import { ICustomBlockElementConfig, ICustomConfig, RemarkBlockElement } from './core/elements'

type HasAncestorParams<T extends Node> = {
  at: Path
  match: NodeMatch<T>
}

export function hasAncestor<T extends Node> (editor: Editor, { at: path, match }: HasAncestorParams<T>): boolean {

  for (const ancestorPath of Path.ancestors(path, { reverse: true })) {
    if (match(Node.get(editor, ancestorPath), ancestorPath)) {
      return true
    }
  }
  return false
}

type HasDescendentParams<T extends Node> = {
  at: Location
  match: NodeMatch<T>
}

export function hasDescendant<T extends Node> (editor: Editor, { at, match }: HasDescendentParams<T>): boolean {
  const [matched] = Editor.nodes(editor, { at, match })
  return !!matched
}

type ConfigMatch<T extends ICustomConfig<any>> = (config: T) => boolean

type HasAncestorBlockParams<T extends RemarkBlockElement, C extends ICustomBlockElementConfig<T>> = HasAncestorParams<T> & {
  configMatch: ConfigMatch<C>
}

export function hasAncestorBlock<T extends RemarkBlockElement, C extends ICustomBlockElementConfig<T>> (editor: Editor, { at: path, match, configMatch }: HasAncestorBlockParams<T, C>): boolean {
  for (const ancestorPath of Path.ancestors(path, { reverse: true })) {
    const node = Node.get(editor, ancestorPath)
    if (match(node, ancestorPath)) {
      const config = editor.factory.customElementMap.get(node.type)
      if (config && !config.isInline && configMatch(config as C)) {
        return true
      }
    }
  }
  return false
}

type HasDescendentBlockParams<T extends RemarkBlockElement, C extends ICustomBlockElementConfig<T>> = {
  at: Location
  match: NodeMatch<T>
  configMatch: ConfigMatch<C>
}

export function hasDescendantBlock<T extends RemarkBlockElement, C extends ICustomBlockElementConfig<T>> (editor: Editor, { at, match, configMatch }: HasDescendentBlockParams<T, C>): boolean {
  const iter = Editor.nodes<T>(editor, { at, match })
  for (const [node] of iter) {
    const config = editor.factory.customElementMap.get(node.type)
    if (config && !config.isInline && configMatch(config as C)) {
      return true
    }
  }
  return false
}


export function isElementType<T extends Exclude<Element, Text>, K extends T['type'] = T['type']> (node: Node, type: K | K[]): node is T {
  if (Element.isElement(node)) {
    if (type instanceof Array) {
      return type.indexOf(node.type as K) >= 0
    } else {
      return node.type === type
    }
  }
  return false
}

export function previousSiblingLastChildPath (editor: Editor, path: Path): Path {
  const siblingPath = Path.previous(path)
  const sibling = Node.get(editor, siblingPath) as Element
  return siblingPath.concat(sibling.children.length)
}
