import React, { forwardRef } from 'react'
import './style.less'

interface VoidElementProps {
  children: JSX.Element | JSX.Element[]
}

const VoidElement = forwardRef<HTMLDivElement, VoidElementProps>(function ({ children }: VoidElementProps, ref): JSX.Element {
  return (
    <div
      className="void-element"
      contentEditable={false}
      ref={ref}
    >
      {children}
    </div>
  )
})

VoidElement.displayName = 'VoidElement'

export default VoidElement
