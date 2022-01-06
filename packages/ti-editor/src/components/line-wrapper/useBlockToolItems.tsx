import React, { SyntheticEvent } from 'react'
import { Editor, PathRef } from 'slate'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import { ActionState, ActionStateRenderer } from '../../slate-markdown/core/actions'

library.add(faBold, faItalic, faStrikethrough, faCode)

export type ToolbarItemProps = {
  key: string
  icon: JSX.Element
  active: boolean
  disabled: boolean
  action?: (event: SyntheticEvent) => void
  tips?: JSX.Element
}

function render<P extends Record<string, unknown>> (state: ActionState<P>, renderer: JSX.Element | ActionStateRenderer<P> | null) {
  if (!renderer) {
    return undefined
  }
  if (typeof renderer === 'function') {
    return renderer(state)
  } else {
    return renderer
  }
}

export default function useBlockToolItems (editor: Editor, pathRef: PathRef | undefined): ToolbarItemProps[][] {
  const path = pathRef?.current

  if (!path) {
    return []
  }

  return editor.factory.lineActions.map(group => {
    return editor.getActions(path, group)
      .map(({ action: { key, icon, tips }, state }) => ({
        key,
        disabled: state.disabled,
        active: state.active,
        icon: render(state, icon),
        tips: render(state, tips),
        action: event => {
          editor.runAction(key, path, event)
        },
      } as ToolbarItemProps))
  })
}
