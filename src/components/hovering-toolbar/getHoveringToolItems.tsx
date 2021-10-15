import React, { SyntheticEvent } from 'react'
import { Editor, Element } from 'slate'
import TextNode from '/src/slate-markdown/elements/text/TextNode'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import { ReactEditor } from 'slate-react'
import { DOMRange } from 'slate-react/dist/utils/dom'
import { ICustomBlockElementConfig } from '/src/slate-markdown/core/elements'

library.add(faBold, faItalic, faStrikethrough, faCode)

export type ToolbarItemProps = {
  key: string
  icon: JSX.Element
  active: boolean
  disabled: boolean
  action?: (event: SyntheticEvent) => void
  tips?: JSX.Element
}

export default function getHoveringToolItems (editor: Editor, domRange: DOMRange | undefined): ToolbarItemProps[] {
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
          if (config && (config as ICustomBlockElementConfig<never>).isHiddenHoverToolbar) {
            return true
          }
        }
        return false
      },
    })
    if (matched) {
      return []
    }
  }

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
