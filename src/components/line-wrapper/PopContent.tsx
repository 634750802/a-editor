import { RemarkBlockElement } from '/src/slate-markdown/core/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import { ToolbarItemProps } from '/src/components/line-wrapper/useBlockToolItems'
import Tippy from '@tippyjs/react'
import ToolbarItem from '/src/components/toolbar-item/ToolbarItem'
import React from 'react'

library.add(faBars)

export interface PopContentProps {
  element: RemarkBlockElement,
  items: ToolbarItemProps[]
}

export default function PopContent ({ element, items }: PopContentProps): JSX.Element {

  return (
    <Tippy
      content={renderItems(items)}
      interactive
    >
      <span
        className="line-operations"
        contentEditable={false}
      >
        <FontAwesomeIcon icon={faBars} />
      </span>
    </Tippy>
  )
}

const renderItems = (items: ToolbarItemProps[]) => {
  return (
    <div className='block-toolbar'>
      {items.map(item => (
        <ToolbarItem
          action={item.action}
          active={item.active}
          disabled={item.disabled}
          icon={item.icon}
          key={item.key}
          tips={item.tips}
        />
      ))}
    </div>
  )
}
