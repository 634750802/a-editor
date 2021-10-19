import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { ActionType } from '@/slate-markdown/core/actions'
import { isElementActive, isRangeCustomTextPropsEnabled } from '@/slate-markdown/elements/text/TextNode'
import { Editor, Element, Path, Transforms } from 'slate'
import { requireFields } from '@/components/form'
import createSchema from './create-schema.json'
import { JSONSchema7 } from 'json-schema'
import ImageNode from '@/slate-markdown/elements/image/ImageNode'

export function register (factory: EditorFactory) {
  factory.defineAction({
    key: 'toggle-image',
    type: ActionType.selection,
    icon: <FontAwesomeIcon icon={faImage} />,
    computeState: (editor, range) => {
      const active = isElementActive(editor, range, 'image')
      const disabled = !Path.equals(Path.parent(range.focus.path), Path.parent(range.anchor.path)) || !isRangeCustomTextPropsEnabled(editor, range)
      return { active, disabled }
    },
    action: (editor, range, state, event) => {
      if (state.active) {
        Transforms.unwrapNodes(editor, {
          at: Editor.unhangRange(editor, range),
          match: n =>
            !Editor.isEditor(n) && Element.isElement(n) && n.type === 'image',
        })
        return true
      } else {
        const rangeRef = Editor.rangeRef(editor, range)
        requireFields<{ src: string, alt: string }>(editor, event.target as HTMLElement, createSchema as JSONSchema7, {
          alt: Editor.string(editor, range),
          src: '',
        })
          .then((data) => {
            if (!rangeRef.current) {
              return
            }
            if (data) {
              const { src, alt } = data
              Editor.withoutNormalizing(editor, () => {
                ImageNode.insert(editor, range, { url: src, title: '', alt })
              })
            }
          })
          .finally(() => {
            rangeRef.unref()
          })
        return false
      }
    },
  })
}
