import React, { useLayoutEffect, useRef } from 'react'
import Form, { FormProps } from '@rjsf/core'
import './style.less'

export interface ActionFormProps<T> {
  schema: FormProps<T>['schema']
  onSubmit: (data: T) => void
  defaultValues: Partial<T>
}

export default function ActionForm<T> ({ schema, onSubmit, defaultValues }: ActionFormProps<T>): JSX.Element {

  return (
    <div contentEditable={false}>
      <Form<T>
        className="action-form"
        formData={defaultValues}
        onSubmit={e => onSubmit(e.formData)}
        schema={schema}
      />
    </div>

  )
}
