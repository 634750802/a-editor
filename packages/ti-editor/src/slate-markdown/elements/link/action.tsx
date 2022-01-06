import { EditorFactory } from '../../core/editor-factory'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { ActionType } from '../../core/actions'
import { isElementActive, isRangeCustomTextPropsEnabled } from '../text/TextNode'
import { Editor, Element, Path, Transforms } from 'slate'
import { requireFields } from '../../../components/form'
import createSchema from './create-schema.json'
import { JSONSchema7 } from 'json-schema'
import LinkNode from './LinkNode'

export function register (factory: EditorFactory) {
  factory.defineAction({
    key: 'toggle-link',
    type: ActionType.selection,
    icon: <FontAwesomeIcon icon={faLink} />,
    computeState: (editor, range) => {
      const active = isElementActive(editor, range, 'link')
      const disabled = !Path.equals(Path.parent(range.focus.path), Path.parent(range.anchor.path)) || !isRangeCustomTextPropsEnabled(editor, range)
      return { active, disabled }
    },
    action: (editor, range, state, event) => {
      if (state.active) {
        Transforms.unwrapNodes(editor, {
          at: Editor.unhangRange(editor, range),
          match: n =>
            !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
        })
        return true
      } else {
        const rangeRef = Editor.rangeRef(editor, range)
        requireFields<{ src: string, text: string }>(editor, event.target as HTMLElement, createSchema as JSONSchema7, {
          text: Editor.string(editor, range),
          src: '',
        })
          .then((data) => {
            if (!rangeRef.current) {
              return
            }
            if (data) {
              const { src, text } = data
              Editor.withoutNormalizing(editor, () => {
                LinkNode.insert(editor, range, { url: src, title: '', text })
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
