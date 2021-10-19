import React from 'react'
import TiEditor from './index'
import { instructionsMd } from '/src/instructions'
import './app.less'
import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import layoutPlugin from '/src/plugins/layout'
import { HistoryEditor } from 'slate-history'

function config (factory: EditorFactory) {
  factory.use(layoutPlugin)
  factory.configSections([
    {
      type: 'section', children: [
        {
          type: 'heading', depth: 1, children: [
            { text: 'section 1', inlineCode: true },
            { text: ' 无法修改或删除，使用方法查看 ' },
            { text: 'plugins/layout', inlineCode: true },
          ],
        },
        {
          type: 'blockquote', children: [{
            type: 'paragraph', children: [
              {text: '用于固定的内容结构'}
            ],
          }],
        },
      ],
    },
  ])
  factory.onEditorMounted(editor => {
    setTimeout(() => {
      HistoryEditor.withoutSaving(editor, () => {
        editor.setSectionMarkdown(0, instructionsMd)
      })
    })
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
        uploadFile={uploadFile}
      />
    </div>
  )
}

export default App
