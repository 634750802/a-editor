import { RemarkBlockElement } from '/src/slate-markdown/core/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faPlus } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import { ToolbarItemProps } from '/src/components/line-wrapper/useBlockToolItems'
import Tippy from '@tippyjs/react'
import ToolbarItem from '/src/components/toolbar-item/ToolbarItem'
import React from 'react'

library.add(faBars, faPlus)

export interface PopContentProps {
  element: RemarkBlockElement,
  items: ToolbarItemProps[][],
  setActive: (active: boolean) => void,
  isEmpty: boolean
}

export default function PopContent ({ isEmpty, element, items, setActive }: PopContentProps): JSX.Element {

  return (
    <Tippy
      appendTo='parent'
      content={renderItems(items)}
      hideOnClick={false}
      interactive
      onHide={() => setActive(false)}
      onShow={() => setActive(true)}
    >
      <span
        className="line-operations"
        contentEditable={false}
      >
        <FontAwesomeIcon icon={isEmpty ? faPlus : faBars} />
      </span>
    </Tippy>
  )
}

const renderItems = (itemGroups: ToolbarItemProps[][]) => {
  return (
    <div className="block-toolbar">
      {itemGroups.map((group, index) => (
        <div
          className='toolbar-group'
          // eslint-disable-next-line react/no-array-index-key
          key={index}
        >
          {group.map(item => (
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
      ))}
    </div>
  )
}
