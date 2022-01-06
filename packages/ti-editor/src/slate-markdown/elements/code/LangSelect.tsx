import React, { ChangeEvent, useCallback } from 'react'
import { Editor, PathRef, Transforms } from 'slate'

type LangSelectProps = {
  editor: Editor
  pathRef: PathRef | undefined
  options: string[]
  lang: string | undefined
}

function LangSelect ({ editor, pathRef, options, lang }: LangSelectProps) {
  const onChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    if (pathRef?.current) {
      Transforms.setNodes(editor, { lang: event.currentTarget.value }, { at: pathRef.current })
    }
  }, [editor, pathRef])

  return (
    <select
      className="lang-selector"
      contentEditable={false}
      onChange={onChange}
      tabIndex={undefined}
      value={lang || undefined}
    >
      <option />

      {options.map(op => (
        <option key={op}>
          {op}
        </option>
      ))}
    </select>
  )
}

export default LangSelect
