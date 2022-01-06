import { Plugin } from 'unified'
import 'unist-util-is'
import { visit } from 'unist-util-visit'
import { Node } from 'unified/lib'
import { Parent } from 'unist-util-is'

const remarkSectionPlugin: Plugin = () => {
  return (tree) => {
    const isParent = (node: Node): node is Parent => {
      return 'children' in node && 'type' in node
    }

    visit(tree, isParent, (parent: Parent) => {
      for (let i = parent.children.length - 1; i >= 0; --i) {
        const node = parent.children[i]
        if (node.type === 'section') {
          parent.children.splice(i, 1, ...(node as Parent).children)
        }
      }
    })
  }
}

export default remarkSectionPlugin
