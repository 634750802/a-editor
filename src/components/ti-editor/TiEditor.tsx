/* eslint-disable react/forbid-component-props */
import React, { forwardRef, useEffect, useMemo } from 'react'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import { BaseEditor, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import PropTypes from 'prop-types'
import { TiCommunityEditorInstance, useInstance } from '/src/components/ti-editor/hooks'
import type { SlateNode as SlateMdastNode, Text as SlateMdastText } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import './editor.less'
import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import register from '/src/slate-markdown/elements/register'
import HoveringToolbar from '/src/components/hovering-toolbar/HoveringToolbar'


// see https://docs.slatejs.org/walkthroughs/01-installing-slate
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & TiEditor
    Element: Exclude<SlateMdastNode, SlateMdastText>
    Text: SlateMdastText
  }
}

export interface TiCommunityEditorProps {
  disabled?: boolean
  initialMarkdown?: string
}

export interface TiEditor {
  shouldUpdatePopper: () => void
  shouldHidePopper: () => void
}


const TiEditor = forwardRef<TiCommunityEditorInstance, TiCommunityEditorProps>(({ disabled = false, initialMarkdown = '' }, ref): JSX.Element => {

  const editorFactory = useMemo(() => {
    const editorFactory = new EditorFactory()
    register(editorFactory)
    return editorFactory
  }, [])

  const editor = useMemo(() => {
    const editor = withReact(withHistory(createEditor()))
    return editorFactory.wrapEditor(editor)
  }, [])

  const editableProps = useMemo(() => {
    return editorFactory.createDefaultEditableProps(editor)
  }, [])
  const [instance, value, setValue] = useInstance(editor)

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(instance)
      } else {
        ref.current = instance
      }
    }
    instance.markdown = initialMarkdown
  }, [editor])

  return (
    // Add the editable component inside the context.
    <Slate
      editor={editor}
      onChange={setValue}
      value={value}
    >
      <HoveringToolbar />

      <Editable
        className="ti-community-editor"
        {...editableProps}
      />
    </Slate>
  )
})

TiEditor.displayName = 'TiEditor'
TiEditor.propTypes = {
  disabled: PropTypes.bool,
  initialMarkdown: PropTypes.string
}
TiEditor.defaultProps = {
  disabled: false,
  initialMarkdown: ''
}

export default TiEditor
