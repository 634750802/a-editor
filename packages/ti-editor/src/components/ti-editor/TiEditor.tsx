/* eslint-disable react/forbid-component-props */
import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import { BaseEditor, createEditor, Descendant, Editor, Element, Node, NodeEntry, Text } from 'slate'
import { HistoryEditor, withHistory } from 'slate-history'
import './editor.less'
import { EditorFactory } from '../../slate-markdown/core/editor-factory'
import register from '../../slate-markdown/elements/register'
import { ICustomElementConfig, MdastContentType, RemarkBlockElement, RemarkElement, RemarkElementProps, RemarkInlineElement, RemarkText } from '../../slate-markdown/core/elements'
import { createPortal } from 'react-dom'
import 'github-markdown-css/github-markdown.css'
import UIContext, { UIContextProps } from './ui-context'
import { coreActionsPlugin } from '../../slate-markdown/core/actions'
import { coreSelectionToolbarPlugin } from '../../slate-markdown/core/selection-toolbar'
import { coreRemarkPlugin } from '../../slate-markdown/core/remark'
import useForceUpdate from '../../hooks/forceUpdate'
import useDimensions from "react-cool-dimensions";

// see https://docs.slatejs.org/walkthroughs/01-installing-slate
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor & TiEditor
    Element: RemarkBlockElement | RemarkInlineElement
    Text: RemarkText
  }
}

export interface TiCommunityEditorProps {
  /**
   * @deprecated
   */
  config?: (factory: EditorFactory) => void
  uploadFile?: (file: File) => Promise<string>
  onAlert?: (title: string, message: string) => void
  isCdnHost?: (url: string) => boolean
  setHang?: (hanging: boolean) => boolean
  disabled?: boolean
  initialMarkdown?: string
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  children?: JSX.Element | JSX.Element[]
  factory: EditorFactory
  placeholder?: string
}

export const enum ToggleStrategy {
  replace = 1,
  wrap = 2,
  unwrap = 3,
  custom = 4
}

export interface TiEditor {
  get markdown (): string

  set markdown (value: string)
}

export interface TiEditor {
  insertFragment: (fragment: Node[], plainText?: void) => void;

  onAlert: (title: string, message: string) => void
  uploadFile?: (file: File) => Promise<string>
  isCdnHost?: (url: string) => boolean
  factory: EditorFactory
  setActionForm: (form: JSX.Element | undefined) => void

  setHang?: (hanging: boolean) => boolean

  nearest: <E extends RemarkElement>(entry: NodeEntry, config: ICustomElementConfig<E>) => NodeEntry<E> | undefined
}

export interface TiEditor {
  isEditable: (node: Node) => boolean
  customLayout?: boolean

  // https://github.com/pingcap-inc/tidb-community-editor/issues/5
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

  unwrap<E1 extends RemarkElement, E2 extends RemarkElement, E3 extends RemarkElement> (entry: NodeEntry, config: [ICustomElementConfig<E1>, ICustomElementConfig<E2>, ICustomElementConfig<E3>]): boolean

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

export function createFactory (config?: (factory: EditorFactory) => void): EditorFactory {
  const editorFactory = new EditorFactory()
  editorFactory.use(coreRemarkPlugin)
  editorFactory.use(coreActionsPlugin)
  editorFactory.use(coreSelectionToolbarPlugin)
  editorFactory.use(register)
  config && config(editorFactory)
  editorFactory.freezeProcessors()
  return editorFactory
}

const TiEditor = forwardRef<Editor, TiCommunityEditorProps>(({ factory: editorFactory, disabled = false, initialMarkdown = '', config, uploadFile, value, onChange: propOnChange, placeholder, isCdnHost, setHang, onAlert, children }: TiCommunityEditorProps, ref): JSX.Element => {

  const forceUpdate = useForceUpdate()

  const editor = useMemo(() => {
    const editor = withReact(withHistory(createEditor()))
    editor.setHang = setHang
    editor.isCdnHost = isCdnHost
    editor.onAlert = onAlert ?? ((title, message) => {
      console.warn(title, message)
    })
    return editorFactory.wrapEditor(editor)
  }, [editorFactory])

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(editor)
      } else {
        ref.current = editor
      }
    }
  }, [editor, ref])

  useEffect(() => {
    if (initialMarkdown) {
      editor.markdown = initialMarkdown
    }
  }, [editor])

  const editableProps = useMemo(() => {
    return editorFactory.createDefaultEditableProps(editor)
  }, [editorFactory, editor])

  const { observe, unobserve, width } = useDimensions()
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    observe(containerRef.current)
    return unobserve
  }, [])

  const uiContextProps = useMemo<UIContextProps>(() => ({
    getEditorDOMRect (): DOMRect {
      return containerRef.current?.getBoundingClientRect() ?? new DOMRect()
    },
    containerWidth: width,
  }), [containerRef, width])

  const [form, setForm] = useState<JSX.Element>()

  editor.setActionForm = setForm
  if (uploadFile) {
    editor.uploadFile = uploadFile
  }

  const formPortal = useMemo(() => {
    if (form) {
      return createPortal(form, document.body)
    } else {
      return undefined
    }
  }, [form])

  const onChange = useCallback((newValue: Descendant[]) => {
    propOnChange(newValue)
  }, [propOnChange])

  useEffect(() => {
    editorFactory.triggerEditorMounted(editor)
  }, [editor])

  useEffect(() => {
    editor.children = value
    forceUpdate()
  }, [editor, value])

  const defaultChildren = useMemo(() => editorFactory.createDefaultChildren(editor), [editorFactory, editor])

  return (
    // Add the editable component inside the context.
    <Slate
      editor={editor}
      onChange={onChange}
      value={value}
    >
      {defaultChildren}

      <UIContext.Provider value={uiContextProps}>
        <div
          className="ti-community-editor-container"
          ref={containerRef}
        >
          <Editable
            as="article"
            className="ti-community-editor markdown-body"
            placeholder={placeholder}
            readOnly={disabled}
            {...editableProps}
          />
        </div>

        {children}
      </UIContext.Provider>

      {formPortal}
    </Slate>
  )
})

TiEditor.displayName = 'TiEditor'

export default TiEditor
