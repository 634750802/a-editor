import React, { MouseEvent, useCallback } from 'react'
import { ToolbarItemProps } from '@/components/hovering-toolbar/getHoveringToolItems'
import classNames from 'classnames'
import Tippy from '@tippyjs/react'
import { useSlateStatic } from 'slate-react'
import 'tippy.js/dist/tippy.css' // optional
import './style.less'
import { Editor } from 'slate'

function ToolbarItem ({ icon, active, disabled, action, tips }: ToolbarItemProps): JSX.Element {
  const editor = useSlateStatic()

  const handleAction = useCallback((event: MouseEvent) => {
    if (action && event.button === 0) {
      event.preventDefault()
      event.stopPropagation()
      if (!disabled) {
        Editor.withoutNormalizing(editor, () => {
          action(event)
        })
      }
    }
  }, [action])

  const el = (
    <span
      className={classNames('toolbar-item', { active, disabled })}
      onMouseDown={handleAction}
    >
      {icon}
    </span>
  )
  if (tips) {
    return (
      <Tippy content={(
        <span className="toolbar-item-tips">
          {tips}
        </span>
      )}
      >
        {el}
      </Tippy>
    )
  } else {
    return el
  }
}

export default ToolbarItem
