import React, { forwardRef } from 'react'
import './style.less'

interface VoidElementProps {
  children: JSX.Element | JSX.Element[]
}

const VoidElement = forwardRef<HTMLDivElement, VoidElementProps>(function ({ children }: VoidElementProps, ref): JSX.Element {
  return (
    <span
      className="void-element"
      contentEditable={false}
      ref={ref}
    >
      {children}
    </span>
  )
})

VoidElement.displayName = 'VoidElement'

export default VoidElement
