import React, { useMemo, useRef, useState } from 'react'
import { useSlateStatic } from 'slate-react'
import { VirtualElement } from '@popperjs/core'
import { usePopper } from 'react-popper'
import './style.less'
import getSelectionToolItems, { ToolbarItemProps } from './getSelectionToolItems'
import ToolbarItem from '../toolbar-item/ToolbarItem'
import { DOMRange } from 'slate-react/dist/utils/dom'
import useForceUpdate from '../../hooks/forceUpdate'

function SelectionToolbar (): JSX.Element {
  const editor = useSlateStatic()

  const ref = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<DOMRange>()
  const [hidden, setHidden] = useState(true)
  const forceUpdate = useForceUpdate()
  const [items, setItems] = useState<ToolbarItemProps[]>([])

  editor.hideSelectionToolbar = () => setHidden(true)

  const ve = useMemo(() => {
    return {
      getBoundingClientRect () {
        if (rangeRef.current) {
          return rangeRef.current.getBoundingClientRect()
        } else {
          return { width: 0, height: 0 }
        }
      },
    } as VirtualElement
  }, [editor, rangeRef])

  const { styles, attributes, update } = usePopper(ve, ref.current, {
    placement: 'top',
    modifiers: [
      { name: 'computeStyles', options: { adaptive: false } },
      { name: 'offset', options: { offset: [0, 8] } },
    ],
  })

  editor.updateSelectionToolbar = (range) => {
    if (range) {
      const isFirstRange = !rangeRef.current
      rangeRef.current = range
      if (isFirstRange) {
        setTimeout(() => {
          editor.updateSelectionToolbar()
        }, 0)
      }
    }
    const nowItems = getSelectionToolItems(editor, rangeRef.current)
    setItems(nowItems)

    if (nowItems.length > 0) {
      setHidden(false)
      update && update()
    } else {
      setHidden(true)
    }
    forceUpdate()
  }

  editor.toggleSelectionToolbar = (range) => {
    if (hidden) {
      editor.updateSelectionToolbar(range)
    } else {
      editor.hideSelectionToolbar()
    }
  }

  return (
    <div
      className="ti-hovering-toolbar"
      ref={ref}
      style={{ ...styles.popper, opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'initial' }}
      {...attributes.popper}
    >

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

export default SelectionToolbar
