import { EditorFactory } from '../../core/editor-factory'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import TextNode, { isDecoratorActive, isRangeCustomTextPropsEnabled, TextNodeDecorator } from './TextNode'
import { ActionType } from '../../core/actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function register (factory: EditorFactory) {
  [
    {
      key: TextNodeDecorator.strong,
      icon: faBold,
      tips: <>加粗</>,
      hotkeys: ['meta+b'],
    },
    {
      key: TextNodeDecorator.emphasis,
      icon: faItalic,
      tips: <>斜体</>,
      hotkeys: ['meta+i'],
    },
    {
      key: TextNodeDecorator.inlineCode,
      icon: faCode,
      tips: <>行内代码</>,
    },
    {
      key: TextNodeDecorator.delete,
      icon: faStrikethrough,
      tips: <>删除</>,
    },
  ].forEach(({ icon, key, tips, hotkeys }) => {
    factory.defineAction({
      key,
      type: ActionType.selection,
      icon: <FontAwesomeIcon icon={icon} />,
      tips,
      hotkeys,
      computeState: (editor, range) => {
        const active = isDecoratorActive(editor, range, key)
        const disabled = !isRangeCustomTextPropsEnabled(editor, range)
        return { active, disabled }
      },
      action: (editor, range, state, event) => {
        TextNode.toggleDecorator(editor, range, key)
        return true
      },
    })
  })
}
