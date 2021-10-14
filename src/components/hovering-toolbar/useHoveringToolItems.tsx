import React, { SyntheticEvent } from 'react'
import { Editor } from 'slate'
import TextNode from '/src/slate-markdown/elements/text/TextNode'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import { ReactEditor } from 'slate-react'
import { DOMRange } from 'slate-react/dist/utils/dom'

library.add(faBold, faItalic, faStrikethrough, faCode)

export type ToolbarItemProps = {
  key: string
  icon: JSX.Element
  active: boolean
  disabled: boolean
  action?: (event: SyntheticEvent) => void
  tips?: JSX.Element
}

export default function useHoveringToolItems (editor: Editor, domRange: DOMRange | undefined): ToolbarItemProps[] {
  if (!domRange) {
    return []
  }
  const range = ReactEditor.toSlateRange(editor, domRange, { exactMatch: true }) ?? editor.selection

  const toolbarItems: ToolbarItemProps [] = TextNode.toolbarItems
    .concat(editor.factory.inlineConfigs.flatMap(config => config.toolbarItems))
    .map((
      { key, isDisabled, isActive, action, icon, tips }) => ({
      key,
      disabled: range ? isDisabled(editor, range) : false,
      active: range ? isActive(editor, range) : false,
      icon,
      action: range ? event => action(editor, range, event) : () => {
      },
      tips,
    }))
  return toolbarItems
}
