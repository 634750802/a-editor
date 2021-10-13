import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { VirtualElement } from '@popperjs/core'
import { usePopper } from 'react-popper'
import './style.less'
import useHoveringToolItems from '/src/components/hovering-toolbar/useHoveringToolItems'
import ToolbarItem from '/src/components/hovering-toolbar/ToolbarItem'

function HoveringToolbar (): JSX.Element {
  const editor = useSlateStatic()

  const ref = useRef<HTMLDivElement>(undefined)
  const [n, setN] = useState(0)

  editor.shouldUpdatePopper = () => setN(n => n + 1)

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

  return (
    <div
      className="ti-hovering-toolbar"
      hidden={items.length === 0}
      ref={ref}
      style={styles.popper}
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
