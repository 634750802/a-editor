import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { VirtualElement } from '@popperjs/core'
import { usePopper } from 'react-popper'
import './style.less'
import useHoveringToolItems from '/src/components/hovering-toolbar/useHoveringToolItems'
import ToolbarItem from '/src/components/hovering-toolbar/ToolbarItem'

function HoveringToolbar (): JSX.Element {
  const editor = useSlateStatic()

  const ref = useRef<HTMLDivElement>(null)
  const [n, setN] = useState(0)
  const [hidden, setHidden] = useState(true)

  editor.shouldUpdatePopper = () => {
    setN(n => n + 1)
    setHidden(false)
  }
  editor.shouldHidePopper = () => setHidden(true)

  const ve = useMemo(() => {
    return {
      getBoundingClientRect () {
        if (editor.selection) {
          const s = ReactEditor.toDOMRange(editor, editor.selection)
          return s.getBoundingClientRect()
        } else {
          return { width: 0, height: 0 }
        }
      },
    } as VirtualElement
  }, [editor])

  const { styles, attributes, update } = usePopper(ve, ref.current, {
    placement: 'top',
    modifiers: [
      { name: 'computeStyles', options: { adaptive: false } },
      { name: 'offset', options: { offset: [0, 8] } },
    ],
  })

  useEffect(() => {
    update && update()
  }, [n, update])

  const items = useHoveringToolItems(editor)

  const invisible = hidden || items.length === 0

  return (
    <div
      className="ti-hovering-toolbar"
      ref={ref}
      style={{...styles.popper, opacity: invisible ? 0 : 1}}
      {...attributes.popper}
    >

      {items.map(item => (
        <ToolbarItem
          action={item.action}
          active={item.active}
          disabled={item.disabled}
          icon={item.icon}
          key={item.key}
        />
      ))}
    </div>
  )
}

export default HoveringToolbar
