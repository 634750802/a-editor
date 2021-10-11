/* eslint-disable react/jsx-one-expression-per-line */
import { defineNode, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Editor } from 'slate'

export default defineNode<RemarkText>({
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
})
