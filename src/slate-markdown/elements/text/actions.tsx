import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { faBold, faCode, faItalic, faStrikethrough } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import TextNode, { isDecoratorActive, isRangeCustomTextPropsEnabled, TextNodeDecorator } from '@/slate-markdown/elements/text/TextNode'
import { ActionType } from '@/slate-markdown/core/actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function register (factory: EditorFactory) {
  [
    {
      key: TextNodeDecorator.strong,
      icon: faBold,
      tips: <>加粗</>,
    },
    {
      key: TextNodeDecorator.emphasis,
      icon: faItalic,
      tips: <>斜体</>,
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
  ].forEach(({ icon, key, tips }) => {
    factory.defineAction({
      key,
      type: ActionType.selection,
      icon: <FontAwesomeIcon icon={icon} />,
      tips,
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
