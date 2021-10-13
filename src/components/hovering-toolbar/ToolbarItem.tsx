import React from 'react'
import { ToolbarItemProps } from '/src/components/hovering-toolbar/useHoveringToolItems'
import classNames from 'classnames'

function ToolbarItem ({ icon, active, action }: ToolbarItemProps): JSX.Element {
  return (
    <span className={classNames('toolbar-item', { active })} onMouseDown={action}>
      {icon}
    </span>
  )
}

export default ToolbarItem
