import React from 'react'
import TiEditor from '/src/components/ti-editor/TiEditor'
import { instructionsMd } from '/src/instructions'
import './app.less'

function App (): JSX.Element {
  return (
    <div>
      <TiEditor initialMarkdown={instructionsMd} />
    </div>
  )
}

export default App
