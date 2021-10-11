import React, { useEffect, useRef, useState } from 'react'
import { TiCommunityEditorInstance } from '/src/components/ti-editor/hooks'
import './app.less'
import TiEditor from '/src/components/ti-editor/TiEditor'
import ImageNode from '/src/slate-markdown/elements/image/ImageNode'

import './instructions'
import { instructionsMd } from '/src/instructions'

function App (): JSX.Element {
  const ref = useRef<TiCommunityEditorInstance>(null)
  const [markdown, setMarkdown] = useState('')


  useEffect(() => {
    const h = setInterval(() => {
      setMarkdown(ref.current?.markdown ?? '')
    }, 1000)
    return () => clearInterval(h)
  }, [])
  const insert = () => {
    const editor = ref.current!.editor
    ImageNode.insert(editor, editor.selection ?? [editor.children.length - 1], {
      url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
      alt: '',
      title: '',
    })
  }

  return (
    <>
      左边是编辑器，右边是编辑器内容实际的 markdown

      <button onClick={insert}>add img</button>

      <div style={{ display: 'flex' }}>
        <TiEditor ref={ref} initialMarkdown={instructionsMd} />

        <textarea
          onChange={event => {
            setMarkdown(event.currentTarget.value)
            ref.current!.markdown = event.currentTarget.value
          }}
          value={markdown}
        />
      </div>
    </>

  )
}

export default App
