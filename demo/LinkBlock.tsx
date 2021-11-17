import React, { useCallback, useState } from 'react'
import TiEditor, { createFactory } from '@/index'
import './app.less'
import { Descendant } from 'slate'
import linkBlockPlugin from '@/plugins/link-block'
import { GithubFilled } from '@ant-design/icons'

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

const factory = createFactory(factory => {
  factory.use(linkBlockPlugin({
    rules: [
      {
        test: /github\.com/,
        render: (editor, link) => {
          const res = /github\.com\/([^/]+)\/([^/]+)/.exec(link)
          if (res) {
            const [, user, repo] = res
            return (
              <span>
                <GithubFilled />
                &nbsp;
                {user}
                /

                {repo}
              </span>
            )
          } else {
            return (
              <span>
                <GithubFilled />
                &nbsp;

                {link}
              </span>
            )
          }
        },
      },
    ],
  }))
})

function App (): JSX.Element {
  const [value, setValue] = useState<Descendant[]>([
    ...factory.parseMarkdown(`# LinkBlock example\n`),
    { type: 'linkBlock', link: 'https://github.com/pingcap-inc/tidb-community-editor', children: [{ text: '' }] } as Descendant,
    { type: 'paragraph', children: [{ text: '' }] },
  ])

  const onChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue)
  }, [value])

  return (
    <div>
      <TiEditor
        factory={factory}
        onChange={onChange}
        uploadFile={uploadFile}
        value={value}
      />
    </div>
  )
}

export default App
