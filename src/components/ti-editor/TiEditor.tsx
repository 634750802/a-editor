/* eslint-disable react/forbid-component-props */
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import { BaseEditor, createEditor, Editor, Element, Node, NodeEntry, Text } from 'slate'
import { withHistory } from 'slate-history'
import PropTypes from 'prop-types'
import { TiCommunityEditorInstance, useInstance } from '/src/components/ti-editor/hooks'
import './editor.less'
import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import register from '/src/slate-markdown/elements/register'
import HoveringToolbar from '/src/components/hovering-toolbar/HoveringToolbar'
import { DOMRange } from 'slate-react/dist/utils/dom'
import { ICustomElementConfig, MdastContentType, RemarkBlockElement, RemarkElement, RemarkElementProps, RemarkInlineElement, RemarkText } from '/src/slate-markdown/core/elements'
import { createPortal } from 'react-dom'
import 'github-markdown-css/github-markdown.css'

// see https://docs.slatejs.org/walkthroughs/01-installing-slate
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & TiEditor
    Element: RemarkBlockElement | RemarkInlineElement
    Text: RemarkText
  }
}

export interface TiCommunityEditorProps {
  disabled?: boolean
  initialMarkdown?: string
}

export const enum ToggleStrategy {
  replace = 1,
  wrap = 2,
  unwrap = 3,
  custom = 4
}

export interface TiEditor {
  updatePopper: (range?: DOMRange) => void
  hidePopper: () => void
  togglePopper: (range?: DOMRange) => void
  factory: EditorFactory
  setActionForm: (form: JSX.Element | undefined) => void

  nearest: <E extends RemarkElement>(entry: NodeEntry, config: ICustomElementConfig<E>) => NodeEntry<E> | undefined
  getAndRemoveMark: (mark: string) => unknown
}

export interface TiEditor {
  // https://github.com/634750802/a-editor/issues/5
  isContent: (node: Node, type: MdastContentType) => node is Element | Text
  canContainsContent: (node: Node, type: MdastContentType) => node is Editor | Element | Text

  getContentTypePair: (node: Node) => [MdastContentType | null, MdastContentType | null]
  getContentType: (node: Node) => MdastContentType | null
  getContentModelType: (node: Node) => MdastContentType | null

  /**
   * Transforms content to a type of element. Will call canToggle first
   * @param path
   * @param config
   * @param params
   */
  toggle: <E extends RemarkElement>(entry: NodeEntry, config: ICustomElementConfig<E>, params: RemarkElementProps<E>) => boolean

  canToggle: <E extends RemarkElement>(entry: NodeEntry, config: ICustomElementConfig<E>, ancestors: boolean) => [NodeEntry, ToggleStrategy] | false

  unwrap<E1 extends RemarkElement> (entry: NodeEntry, config: [ICustomElementConfig<E1>]): boolean

  unwrap<E1 extends RemarkElement, E2 extends RemarkElement> (entry: NodeEntry, config: [ICustomElementConfig<E1>, ICustomElementConfig<E2>]): boolean

  unwrap (entry: NodeEntry, config: ICustomElementConfig<RemarkElement>[]): boolean

  canUnwrap<E1 extends RemarkElement> (entry: NodeEntry, config: [ICustomElementConfig<E1>]): boolean

  canUnwrap<E1 extends RemarkElement, E2 extends RemarkElement> (entry: NodeEntry, config: [ICustomElementConfig<E1>, ICustomElementConfig<E2>]): boolean

  canUnwrap (entry: NodeEntry, config: ICustomElementConfig<RemarkElement>[]): boolean

  wrap<E1 extends RemarkElement> (entry: NodeEntry, configs: [ICustomElementConfig<E1>], params: [RemarkElementProps<E1>]): boolean

  wrap<E1 extends RemarkElement, E2 extends RemarkElement> (entry: NodeEntry, configs: [ICustomElementConfig<E1>, ICustomElementConfig<E2>], params: [RemarkElementProps<E1>, RemarkElementProps<E2>]): boolean

  wrap (entry: NodeEntry, configs: ICustomElementConfig<RemarkElement>[], params: RemarkElementProps<any>[]): boolean

  canWrap<E1 extends RemarkElement> (entry: NodeEntry, configs: [ICustomElementConfig<E1>], params: [RemarkElementProps<E1>]): boolean

  canWrap<E1 extends RemarkElement, E2 extends RemarkElement> (entry: NodeEntry, configs: [ICustomElementConfig<E1>, ICustomElementConfig<E2>], params: [RemarkElementProps<E1>, RemarkElementProps<E2>]): boolean

  canWrap (entry: NodeEntry, configs: ICustomElementConfig<RemarkElement>[], params: RemarkElementProps<any>[]): boolean

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

  const [form, setForm] = useState<JSX.Element>()

  editor.setActionForm = setForm

  const formPortal = useMemo(() => {
    if (form) {
      return createPortal(form, document.body)
    } else {
      return undefined
    }
  }, [form])

  return (
    // Add the editable component inside the context.
    <Slate
      editor={editor}
      onChange={setValue}
      value={value}
    >
      <HoveringToolbar />

      <Editable
        as="article"
        className="ti-community-editor markdown-body"
        {...editableProps}
      />

      {formPortal}
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
