import { useSlateStatic } from 'slate-react'
import { useEffect, useRef } from 'react'
import { Descendant, Editor, Operation, Range } from 'slate'

interface VirtualSectionInputProps {
  section: number
  value?: Descendant[]
  onChange: (value: Descendant[], toMarkdown: () => string) => void
  initialMarkdownValue?: string
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


export default function VirtualSectionInput ({ section, value, onChange: propOnChange }: VirtualSectionInputProps): null {
  const editor = useSlateStatic()
  const valueRef = useRef<Descendant[] | undefined>(value)
  const onChangeRef = useRef<VirtualSectionInputProps['onChange']>(propOnChange)

  valueRef.current = value
  onChangeRef.current = propOnChange

  useEffect(() => {
    const range = editor.getSectionRange(section)
    if (range) {
      if (valueRef.current) {
        editor.setSection(section, valueRef.current)
      }
    }

    const resetOnChange = editor.factory.registerOnChange(() => {
      const range = editor.getSectionRange(section)

      if (!range) {
        return
      }

      if (isOperationInRange(editor, editor.operations, range)) {
        const fragment = editor.getSection(section)
        onChangeRef.current(fragment, () => editor.factory.generateMarkdown(fragment))
      }
    })

    const resetOnSectionLayout = editor.factory.registerOnSectionLayout((i) => {
      if (section !== i) {
        return
      }
      const range = editor.getSectionRange(section)
      if (range && valueRef.current) {
        editor.setSection(section, valueRef.current)
      }
    })

    return () => {
      resetOnChange()
      resetOnSectionLayout()
    }
  }, [editor])

  useEffect(() => {
    if (value) {
      editor.setSection(section, value)
    }
  }, [value])

  return null
}
