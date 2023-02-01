import UIContext from '@/components/ti-editor/ui-context';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { Enable, Resizable, ResizeCallback } from 're-resizable';
import React, { ReactEventHandler, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate';
import { Editor, Node, Path, Transforms } from 'slate';
import { ReactEditor, useSelected } from 'slate-react';
import VoidElement from '../../../components/void-element/void-element';
import {
  defineNode,
  ICustomInlineElementConfig,
  MdastContentType,
  RemarkElementProps,
  TypedRenderElementProps,
} from '../../core/elements';
import { isElementType } from '@/slate-markdown/slate-utils';


library.add(faImage)

type Size = {
  width: number
  height: number
}

interface ImageExtension {
  size?: Size
}

function applyDelta (size: Size | undefined, delta: Size | undefined): Size | undefined {
  if (size) {
    if (delta) {
      return { width: size.width + delta.width, height: size.height + delta.height };
    } else {
      return size;
    }
  }
  return undefined
}

const ImageNode = defineNode<Image>({
  type: 'image',
  isInline: true,
  isLeaf: false,
  contentType: MdastContentType.staticPhrasing,
  contentModelType: null,
  render: (editor: Editor, { element, attributes, children }: TypedRenderElementProps<Image & ImageExtension>): JSX.Element => {
    const selected = useSelected()
    const readonly = ReactEditor.isReadOnly(editor)

    const { containerWidth } = useContext(UIContext)

    const [resizable, setResizable] = useState(false)
    const [size, setSize] = useState<Size | undefined>(element.size)
    const [aspect, setAspect] = useState<number>()
    const [delta, setDelta] = useState<Size>()

    const onLoad: ReactEventHandler<HTMLImageElement> = useCallback((event) => {
      const img = event.currentTarget
      const size = {
        width: img.width,
        height: img.width / img.naturalWidth * img.naturalHeight,
      }
      setSize(size)
      setAspect(img.naturalWidth / img.naturalHeight)
      setResizable(true)
      if (!element.size) {
        const path = ReactEditor.findPath(editor, element)
        Editor.withoutNormalizing(editor, () => {
          Transforms.setNodes<Image & ImageExtension>(editor, { size }, { at: path })
        })
      }
    }, [])

    const enable: Enable = useMemo(() => {
      return {
        bottomRight: !readonly && resizable,
      }
    }, [resizable, readonly])

    const onResize: ResizeCallback = useCallback((_e, _d, _el, delta) => {
      setDelta(delta)
    }, [])

    const onResizeStop: ResizeCallback = useCallback((_e, _d, _el, delta) => {
      setSize(size => {
        const path = ReactEditor.findPath(editor, element)
        const newSize = applyDelta(size, delta)
        Editor.withoutNormalizing(editor, () => {
          Transforms.setNodes<Image & ImageExtension>(editor, { size: newSize }, { at: path })
        })
        return newSize
      })
      setDelta(undefined)
    }, [])

    if (readonly) {
      return (
        <VoidElement attributes={attributes}>
          <img
            alt={element.alt ?? undefined}
            className={classNames({ selected })}
            src={element.url}
            title={element.title ?? undefined}
            width={size?.width}
          />

          {children}
        </VoidElement>
      )
    } else {
      const realSize = applyDelta(size, delta)
      return (
        <VoidElement attributes={attributes}>
          <Resizable
            className={classNames('resizable', { selected })}
            defaultSize={size}
            enable={enable}
            handleClasses={{ bottomRight: 'resize-handle-bottom-right' }}
            lockAspectRatio={aspect}
            maxWidth={containerWidth || 640}
            onResize={onResize}
            onResizeStop={onResizeStop}
            size={realSize}
          >
            <img
              alt={element.alt ?? undefined}
              height={realSize?.height}
              onLoad={onLoad}
              src={element.url}
              title={element.title ?? undefined}
              width={realSize?.width}
            />
          </Resizable>

          {children}
        </VoidElement>
      )
    }
  },
  normalize: (editor, element, path) => {
    const p = Editor.parent(editor, path)
    if (p && isElementType(p[0], 'link')) {
      Transforms.moveNodes(editor, { at: path, to: p[1]})
    }
  },
  insert: (editor, location, params: RemarkElementProps<Image>) => {
    Transforms.insertNodes(editor, [
      { text: ' ' },
      { type: 'image', children: [], ...params },
      { text: ' ' },
    ], { at: location })
  },
} as Omit<ICustomInlineElementConfig<Image, Record<string, unknown>>, 'register'>)

export default ImageNode
