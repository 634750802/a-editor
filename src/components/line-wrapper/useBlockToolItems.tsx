import React, { SyntheticEvent } from 'react'
import { Editor, Path, Range } from 'slate'
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

export default function useBlockToolItems (editor: Editor, path: Path | undefined): ToolbarItemProps[] {
  const toolbarItems: ToolbarItemProps [] = editor.factory.blockConfigs.flatMap(config => config.toolbarItems)
    .map((
      { key, isDisabled, isActive, action, icon, tips }) => ({
      key,
      disabled: path ? isDisabled(editor, path) : false,
      active: path ? isActive(editor, path) : false,
      icon,
      action: path ? event => action(editor, path, event) : () => {
      },
      tips,
    }))
  return toolbarItems
}
