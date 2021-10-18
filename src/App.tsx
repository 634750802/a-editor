import React from 'react'
import TiEditor from './index'
import { instructionsMd } from '/src/instructions'
import './app.less'
import { EditorFactory } from '/src/slate-markdown/core/editor-factory'

function config (factory: EditorFactory) {
  factory.configProcessor(processor => {

  })
}

async function uploadFile (file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function() {
      setTimeout(() => {
        resolve(reader.result as string);
      }, 500)
    }
    reader.onerror = function () {
      reject(reader.error)
    }
    reader.readAsDataURL(file);
  })
}

function App (): JSX.Element {
  return (
    <div>
      <TiEditor
        config={config}
        disabled
        initialMarkdown={instructionsMd}
        uploadFile={uploadFile}
      />
    </div>
  )
}

export default App
