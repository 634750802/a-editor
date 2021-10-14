/* eslint-disable react/jsx-no-bind */
import { RemarkBlockElement } from '/src/slate-markdown/core/elements'
import Tippy from '@tippyjs/react/headless'
import PopContent from '/src/components/line-wrapper/PopContent'
import './style.less'
import { useLayoutEffect, useRef, useState } from 'react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { Editor, Node, Path } from 'slate'
import useBlockToolItems from '/src/components/line-wrapper/useBlockToolItems'
import useForceUpdate from '/src/hooks/forceUpdate'

export interface TopLevelBlockProps {
  element: RemarkBlockElement
  children: JSX.Element
}


export default function LineWrapper ({ element, children }: TopLevelBlockProps): JSX.Element {

  const [el, setEl] = useState<Element | null>(null)
  const pathRef = useRef<Path>()

  const editor = useSlateStatic()

  const items = useBlockToolItems(editor, pathRef.current)

  const forceUpdate = useForceUpdate()

  useLayoutEffect(() => {
    if (el) {
      const dr = document.createRange()
      dr.selectNode(el.childNodes.item(0))
      const range = ReactEditor.toSlateRange(editor, dr, { exactMatch: false })

      let path = Path.common(range.anchor.path, range.focus.path)
      while (path.length !== 0) {
        if (Editor.isBlock(editor, Node.get(editor, path))) {
          pathRef.current = path
          break
        }
        path = Path.parent(path)
      }
    } else {
      pathRef.current = undefined
    }
  }, [el])

  return (
    <Tippy
      appendTo={document.body}
      arrow={false}
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
          items={items}
        />
      )}
    >
      {children}
    </Tippy>
  )
}

