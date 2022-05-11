import { isElementType } from '@/slate-markdown/slate-utils';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { JSONSchema7 } from 'json-schema';
import React from 'react';
import { Image, Paragraph } from 'remark-slate-transformer/lib/transformers/mdast-to-slate';
import { Editor, Element, Node, Path, Transforms } from 'slate';
import { requireFields } from '../../../components/form';
import { ActionType } from '../../core/actions';
import { EditorFactory } from '../../core/editor-factory';
import { isElementActive, isRangeCustomTextPropsEnabled } from '../text/TextNode';
import createSchema from './create-schema.json';
import ImageNode from './ImageNode';

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

  factory.defineAction({
    key: 'insert-image',
    type: ActionType.toplevel,
    icon: <FontAwesomeIcon icon={faImage} />,
    computeState: (editor, location) => {
      const node = Node.get(editor, location)
      if (isElementType<Paragraph>(node, 'paragraph')) {
        let hasImg = false
        let hasText = false
        for (const child of node.children) {
          if ('text' in child) {
            if (child.text) {
              hasText = true
            }
          } else if (isElementType<Image>(child, 'image')) {
            hasImg = true
          } else {
            hasText = true
          }
        }
        return {
          active: hasImg,
          disabled: hasImg || hasText
        }
      } else {
        return {
          active: false,
          disabled: true,
        }
      }
    },
    action: (editor, location, state, event) => {
      const input = document.createElement('input')
      input.accept = 'image/*'
      input.type = 'file'
      input.onchange = () => {
        if (input.files) {
          const file = input.files.item(0)
          if (file) {
            (async () => {
              const url = await editor.uploadFile?.(file)
              if (url) {
                Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }]}, { at: location })
                ImageNode.insert(editor, location.concat(0), { url, title: '', alt: 'no-alt' })
              }
            })();
          }
        }
      }
      input.click()
      return false
    }
  })
}
