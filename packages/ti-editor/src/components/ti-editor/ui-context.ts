import { createContext } from 'react'

export interface UIContextProps {
  getEditorDOMRect (): DOMRect
}

const UIContext = createContext<UIContextProps>({
  getEditorDOMRect: () => new DOMRect(),
})

export default UIContext
