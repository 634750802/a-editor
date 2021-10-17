import React, { SyntheticEvent } from 'react'
import { Editor, PathRef } from 'slate'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'

library.add(faBold, faItalic, faStrikethrough, faCode)

export type ToolbarItemProps = {
  key: string
  icon: JSX.Element
  active: boolean
  disabled: boolean
  action?: (event: SyntheticEvent) => void
  tips?: JSX.Element
}

export default function useBlockToolItems (editor: Editor, pathRef: PathRef | undefined): ToolbarItemProps[][] {
  const path = pathRef?.current
  return editor.factory.blockConfigs
    .map(config => config.toolbarItems.map((
      { key, isDisabled, isActive, action, icon, tips }) => ({
      key,
      disabled: path ? isDisabled(editor, path) : false,
      active: path ? isActive(editor, path) : false,
      icon,
      action: path
        ? event => {
          action(editor, path, event)
          event.preventDefault()
          event.stopPropagation()
        }
        : () => {
        },
      tips,
    } as ToolbarItemProps)))
    .filter(items => items.length > 0)
}
