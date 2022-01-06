import React, { forwardRef, MutableRefObject } from 'react'
import './style.less'
import { RenderElementProps } from 'slate-react'

interface VoidElementProps {
  attributes: RenderElementProps['attributes']
  children: JSX.Element | JSX.Element[]
}

type ForwardedRef<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null;

function applyRef<T> (ref: T, forwardedRef: ForwardedRef<T>) {
  if (forwardedRef) {
    if (typeof forwardedRef === 'function') {
      forwardedRef(ref)
    } else {
      forwardedRef.current = ref
    }
  }
}

function combineRef<T> (ref1: ForwardedRef<T>, ref2: ForwardedRef<T>) {
  return (el: T) => {
    applyRef(el, ref1)
    applyRef(el, ref2)
  }
}

const VoidElement = forwardRef<HTMLDivElement, VoidElementProps>(function ({ children, attributes: { ref: attrRef, ...attributes } }: VoidElementProps, ref): JSX.Element {
  return (
    <span
      className="void-element"
      contentEditable={false}
      ref={combineRef(ref, attrRef as never)}
      {...attributes}
    >
      {children}
    </span>
  )
})

VoidElement.displayName = 'VoidElement'

export default VoidElement
