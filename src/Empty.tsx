import React, { useCallback, useState } from 'react'
import TiEditor from './index'
import './app.less'
import { Descendant } from 'slate'

async function uploadFile (file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = function () {
      setTimeout(() => {
        resolve(reader.result as string)
      }, 500)
    }
    reader.onerror = function () {
      reject(reader.error)
    }
    reader.readAsDataURL(file)
  })
}

function App (): JSX.Element {
  const [value, setValue] = useState<Descendant[]>([{
    type: 'paragraph',
    children: [{ text: 'here to input' }]
  }])

  const onChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue)
  }, [value])

  return (
    <div>
      <TiEditor
        onChange={onChange}
        uploadFile={uploadFile}
        value={value}
      />
    </div>
  )
}

export default App
