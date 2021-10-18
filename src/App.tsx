import React from 'react'
import TiEditor from '/src/components/ti-editor/TiEditor'
import { instructionsMd } from '/src/instructions'
import './app.less'
import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import remarkGfm from 'remark-gfm'

function config (factory: EditorFactory) {
  factory.configProcessor(processor => {

  })
}

function App (): JSX.Element {
  return (
    <div>
      <TiEditor
        config={config}
        initialMarkdown={instructionsMd}
      />
    </div>
  )
}

export default App
