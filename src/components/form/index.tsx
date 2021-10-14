import React, { RefObject, useCallback, useMemo, useRef } from 'react'
import { JSONSchema7 } from 'json-schema'
import Tippy from '@tippyjs/react'
import ActionForm from '/src/components/form/ActionForm'
import { Instance } from 'tippy.js'
import { Editor } from 'slate'
import { ReactEditor } from 'slate-react'

function useGetReferenceClientRect (editor: Editor, el: Element) {
  return useCallback(() => {
    if (editor.selection) {
      return ReactEditor.toDOMRange(editor, editor.selection).getBoundingClientRect()
    } else {
      return el.getBoundingClientRect()
    }
  }, [editor, el])
}

function useOnClickOutside (reject: (error: string) => void, instance: RefObject<Instance | undefined>) {
  return useCallback(() => {
    reject('user canceled')
    if (instance.current) {
      instance.current.hide()
    }
  }, [reject])
}

function useInstanceRef (): [RefObject<Instance | undefined>, (i: Instance) => void] {
  const instance = useRef<Instance>()

  const setInstanceRef = useCallback((i: Instance) => {
    instance.current = i
  }, [instance])

  return [instance, setInstanceRef]
}

function useActionForm<T> (schema: JSONSchema7, resolve: (data: T) => void, defaultValues: T, instance: RefObject<Instance | undefined>): JSX.Element {
  const onSubmit = useCallback((data: T) => {
    resolve(data)
    instance.current?.hide()
  }, [resolve, instance])
  return useMemo(() => {
    return (
      <ActionForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        schema={schema}
      />
    )
  }, [schema, onSubmit])
}

interface TippyFormProps<T> {
  editor: Editor
  el: Element
  schema: JSONSchema7
  resolve: (data: T) => void
  reject: (error: unknown) => void
  defaultValues: T
}

function TippyForm<T> ({ editor, el, reject, resolve, schema, defaultValues }: TippyFormProps<T>) {

  const [instance, setInstanceRef] = useInstanceRef()
  const getReferenceClientRect = useGetReferenceClientRect(editor, el)
  const onClickOutside = useOnClickOutside(reject, instance)
  const actionForm = useActionForm(schema, resolve, defaultValues, instance)

  return (
    <Tippy
      content={actionForm}
      getReferenceClientRect={getReferenceClientRect}
      interactive
      onClickOutside={onClickOutside}
      onMount={setInstanceRef}
      placement="right-start"
      visible
    >
      <span />
    </Tippy>
  )
}

export function requireFields<T> (editor: Editor, el: Element, schema: JSONSchema7, defaultValues: T): Promise<T | undefined> {
  return (new Promise<T>((resolve, reject) => {
    editor.setActionForm(
      <TippyForm
        defaultValues={defaultValues}
        editor={editor}
        el={el}
        reject={reject}
        resolve={resolve}
        schema={schema}
      />,
    )
  }))
    .catch(err => {
      if (err === 'user canceled') {
        return Promise.resolve(undefined)
      } else {
        throw err
      }
    })
}
