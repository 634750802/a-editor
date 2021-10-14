import React, { MouseEvent, useCallback } from 'react'
import { ToolbarItemProps } from '/src/components/hovering-toolbar/useHoveringToolItems'
import classNames from 'classnames'
import Tippy from '@tippyjs/react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import 'tippy.js/dist/tippy.css'; // optional
import './style.less'
import { Editor } from 'slate'

function ToolbarItem ({ icon, active, action, tips }: ToolbarItemProps): JSX.Element {
  const editor = useSlateStatic()

  const handleAction = useCallback((event: MouseEvent) => {
    if (action && event.button === 0) {
      Editor.withoutNormalizing(editor, () => {
        action(event)
        event.preventDefault()
        event.stopPropagation()
        ReactEditor.focus(editor)
      })
    }
  }, [action])

  const el = (
    <span
      className={classNames('toolbar-item', { active })}
      onMouseDown={handleAction}
    >
      {icon}
    </span>
  )
  if (tips) {
    return (
      <Tippy content={tips}>
        {el}
      </Tippy>
    )
  } else {
    return el
  }
}

export default ToolbarItem
