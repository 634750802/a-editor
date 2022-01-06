import { useSlateStatic } from 'slate-react'
import { useEffect, useRef } from 'react'
import { Descendant, Editor, Operation, Range } from 'slate'


interface VirtualSectionInputProps {
  section: number
  value: Descendant[]
  onChange: (value: Descendant[]) => void
}

function isOperationInRange (editor: Editor, operations: Operation[], range: Range): boolean {
  for (const operation of operations) {
    if (Operation.isNodeOperation(operation) || Operation.isTextOperation(operation)) {
      if (Range.includes(range, operation.path)) {
        return true
      }
    }
  }
  return false
}


export default function VirtualSectionInput ({ section, value = [], onChange }: VirtualSectionInputProps): null {
  const editor = useSlateStatic()
  const onChangeRef = useRef(onChange)
  const valueRef = useRef<Descendant[]>([])
  onChangeRef.current = onChange

  useEffect(() => {
    const resetOnChange = editor.factory.registerOnChange(() => {
      const range = editor.getSectionRange(section)

      if (!range) {
        return
      }

      if (isOperationInRange(editor, editor.operations, range)) {
        const fragment = editor.getSection(section)
        valueRef.current = fragment
        onChangeRef.current(fragment)
      }
    })

    const resetOnSectionLayout = editor.factory.registerOnSectionLayout((i) => {
      if (section !== i) {
        return
      }
      if (value !== valueRef.current) {
        valueRef.current = value
        editor.setSection(section, value)
      }
    })

    return () => {
      resetOnChange()
      resetOnSectionLayout()
    }
  }, [editor])

  useEffect(() => {
    if (value !== valueRef.current) {
      editor.setSection(section, value)
    }
  }, [value])

  return null
}
