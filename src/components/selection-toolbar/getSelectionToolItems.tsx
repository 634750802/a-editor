import React, { SyntheticEvent } from 'react'
import { Editor, Element } from 'slate'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import { ReactEditor } from 'slate-react'
import { DOMRange } from 'slate-react/dist/utils/dom'
import { MdastContentType } from '@/slate-markdown/core/elements'
import { ActionState, ActionStateRenderer } from '@/slate-markdown/core/actions'

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

export default function getSelectionToolItems (editor: Editor, domRange: DOMRange | undefined): ToolbarItemProps[] {
  if (!domRange) {
    return []
  }
  const range = ReactEditor.toSlateRange(editor, domRange, { exactMatch: true }) ?? editor.selection

  if (range) {
    const [matched] = Editor.nodes(editor, {
      at: range,
      match: node => {
        const type = (node as Element).type
        if (type) {
          const config = editor.factory.customElementMap.get(type)
          if (config && config.contentModelType !== MdastContentType.value) {
            return true
          }
        }
        return false
      },
    })
    if (!matched) {
      return []
    }
  }


  return editor.getActions(range ?? undefined, editor.factory.selectionActions)
    .map(({ action: { key, icon, tips }, state }) => ({
      key,
      disabled: state.disabled,
      active: state.active,
      icon: render(state, icon),
      tips: render(state, tips),
      action: event => {
        editor.runAction(key, range ?? undefined, event)
      },
    } as ToolbarItemProps))
    .filter(item => !item.disabled)
}
