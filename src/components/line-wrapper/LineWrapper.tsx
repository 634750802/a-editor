/* eslint-disable react/jsx-no-bind */
import { RemarkBlockElement } from '@/slate-markdown/core/elements'
import Tippy from '@tippyjs/react/headless'
import PopContent from '@/components/line-wrapper/PopContent'
import './style.less'
import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { ReactEditor, useReadOnly, useSlateStatic } from 'slate-react'
import { Editor, Node, Path, PathRef, Text } from 'slate'
import useBlockToolItems from '@/components/line-wrapper/useBlockToolItems'
import useForceUpdate from '@/hooks/forceUpdate'
import UIContext from '@/components/ti-editor/ui-context'

const EOF = String.fromCharCode(0xfe, 0xff)

export interface TopLevelBlockProps {
  element: RemarkBlockElement
  children: JSX.Element | ((ctx: LineWrapperContext) => JSX.Element)
}

interface LineWrapperContext {
  active: boolean
  pathRef: PathRef | undefined
}

export default function LineWrapper ({ element, children }: TopLevelBlockProps): JSX.Element {

  const [el, setEl] = useState<Element | null>(null)
  const pathRef = useRef<PathRef>()

  const editor = useSlateStatic()

  const items = useBlockToolItems(editor, pathRef.current)

  const forceUpdate = useForceUpdate()

  const [extraWidth, setExtraWidth] = useState(0)

  const { getEditorDOMRect } = useContext(UIContext)
  const getRect = useCallback(() => {
    const elRect: DOMRect = el?.getBoundingClientRect() ?? new DOMRect()
    const { x: lineX = 0 } = elRect
    const { x } = getEditorDOMRect()
    setExtraWidth(lineX - x)
    return elRect
  }, [getEditorDOMRect, el])

  useLayoutEffect(() => {
    if (el) {
      const dr = document.createRange()
      dr.selectNode(el.childNodes.item(0))
      const range = ReactEditor.toSlateRange(editor, dr, { exactMatch: false })

      let path = Path.common(range.anchor.path, range.focus.path)
      while (path.length !== 0) {
        if (Editor.isBlock(editor, Node.get(editor, path))) {
          pathRef.current = Editor.pathRef(editor, path)
          break
        }
        path = Path.parent(path)
      }
    } else {
      if (pathRef.current) {
        pathRef.current.unref?.()
      }
      pathRef.current = undefined
    }
  }, [el])

  const [active, setActive] = useState(false)

  const isEmpty = (() => {
    const node = element.children[0]
    return element.children.length === 1 && Text.isText(node) && node.text === ''
  })()

  const readonly = useReadOnly()

  if (readonly) {
    return typeof children === 'function' ? children({ active, pathRef: pathRef.current }) : children
  }

  return (
    <Tippy
      appendTo={document.body}
      arrow={false}
      getReferenceClientRect={getRect}
      hideOnClick={false}
      interactive
      interactiveBorder={12}
      offset={[0, 8]}
      onTrigger={forceUpdate}
      placement="left"
      popperOptions={{
        modifiers: [
          {
            name: 'flip', options: {
              allowedAutoPlacements: ['left'],
            },
          },
        ],
      }}
      ref={setEl}
      render={() => (
        <PopContent
          element={element}
          extraWidth={extraWidth}
          isEmpty={isEmpty}
          items={items}
          setActive={setActive}
        />
      )}
    >
      {typeof children === 'function' ? children({ active, pathRef: pathRef.current }) : children}
    </Tippy>
  )
}

