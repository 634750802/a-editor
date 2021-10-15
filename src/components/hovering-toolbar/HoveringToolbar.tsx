import React, { useMemo, useRef, useState } from 'react'
import { useSlateStatic } from 'slate-react'
import { VirtualElement } from '@popperjs/core'
import { usePopper } from 'react-popper'
import './style.less'
import useHoveringToolItems from '/src/components/hovering-toolbar/useHoveringToolItems'
import ToolbarItem from '/src/components/toolbar-item/ToolbarItem'
import { DOMRange } from 'slate-react/dist/utils/dom'
import useForceUpdate from '/src/hooks/forceUpdate'

function HoveringToolbar (): JSX.Element {
  const editor = useSlateStatic()

  const ref = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<DOMRange>()
  const [hidden, setHidden] = useState(true)
  const forceUpdate = useForceUpdate()

  editor.hidePopper = () => setHidden(true)

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

  const items = useHoveringToolItems(editor, rangeRef.current)

  editor.updatePopper = (range) => {
    if (range) {
      const isFirstRange = !rangeRef.current
      rangeRef.current = range
      if (isFirstRange) {
        setTimeout(() => {
          editor.updatePopper()
        }, 0)
      }
    }
    if (items.length > 0) {
      setHidden(false)
      update && update()
    } else {
      setHidden(true)
    }
    forceUpdate()
  }

  editor.togglePopper = (range) => {
    if (hidden) {
      editor.updatePopper(range)
    } else {
      editor.hidePopper()
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

export default HoveringToolbar
