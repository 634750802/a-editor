import { createContext } from 'react'

export interface UIContextProps {
  getEditorDOMRect (): DOMRect
  containerWidth: number
}

const UIContext = createContext<UIContextProps>({
  getEditorDOMRect: () => new DOMRect(),
  containerWidth: 0,
})

export default UIContext
