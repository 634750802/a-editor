import React, { SyntheticEvent } from 'react'
import { Editor } from 'slate'
import TextNode, { isDecoratorActive, TextNodeDecorator } from '/src/slate-markdown/elements/text/TextNode'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ReactEditor } from 'slate-react'

library.add(faBold, faItalic, faStrikethrough, faCode)

export type ToolbarItemProps = {
  key: string
  icon: JSX.Element
  active: boolean
  disabled: boolean
  action?: (event: SyntheticEvent) => void
}

export default function useHoveringToolItems (editor: Editor): ToolbarItemProps[] {
  if (!editor.selection) {
    return []
  }
  const toolbarItems: ToolbarItemProps [] = [
    {
      key: TextNodeDecorator.strong,
      icon: <FontAwesomeIcon icon={faBold} />,
      active: isDecoratorActive(editor, editor.selection, TextNodeDecorator.strong),
      disabled: false,
      action: (event) => {
        console.log(editor.selection)
        TextNode.toggleDecorator(editor, TextNodeDecorator.strong)
        event.preventDefault()
        event.stopPropagation()
        ReactEditor.focus(editor)
      }
    },
    {
      key: TextNodeDecorator.emphasis,
      icon: <FontAwesomeIcon icon={faItalic} />,
      active: isDecoratorActive(editor, editor.selection, TextNodeDecorator.emphasis),
      disabled: false,
      action: (event) => {
        TextNode.toggleDecorator(editor, TextNodeDecorator.emphasis)
        event.preventDefault()
        event.stopPropagation()
        ReactEditor.focus(editor)
      }
    },
    {
      key: TextNodeDecorator.delete,
      icon: <FontAwesomeIcon icon={faStrikethrough} />,
      active: isDecoratorActive(editor, editor.selection, TextNodeDecorator.delete),
      disabled: false,
      action: (event) => {
        TextNode.toggleDecorator(editor, TextNodeDecorator.delete)
        event.preventDefault()
        event.stopPropagation()
        ReactEditor.focus(editor)
      }
    },
    {
      key: TextNodeDecorator.inlineCode,
      icon: <FontAwesomeIcon icon={faCode} />,
      active: isDecoratorActive(editor, editor.selection, TextNodeDecorator.inlineCode),
      disabled: false,
      action: (event) => {
        TextNode.toggleDecorator(editor, TextNodeDecorator.inlineCode)
        event.preventDefault()
        event.stopPropagation()
        ReactEditor.focus(editor)
      }
    },
  ]
  return toolbarItems
}
