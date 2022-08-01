import UIContext from '@/components/ti-editor/ui-context';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { Enable, Resizable, ResizeCallback } from 're-resizable';
import React, {
  ReactEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate';
import { Editor, Transforms } from 'slate';
import { ReactEditor, useSelected } from 'slate-react';
import VoidElement from '../../../components/void-element/void-element';
import {
  defineNode,
  ICustomInlineElementConfig,
  MdastContentType,
  RemarkElementProps,
  TypedRenderElementProps,
} from '../../core/elements';


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

// https://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-with-jquery
function isImgOk(img?: HTMLImageElement | null) {
  if (!img) {
    return false
  }
  if (!img.complete) {
    return false
  }
  if (img.naturalWidth === 0) {
    return false
  }
  return true
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
    const aspectRef = useRef<number>()
    const [delta, setDelta] = useState<Size>()
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    // determine if img is loaded
    const onLoad: ReactEventHandler<HTMLImageElement> = useCallback(() => {
      setLoaded(true)
    }, [])

    useEffect(() => {
      if (isImgOk(imgRef.current)) {
        setLoaded(true)
      }
      return () => {
        setLoaded(false)
        setResizable(false)
      }
    }, [element.url])

    // set initial info if loaded
    useEffect(() => {
      setResizable(true)
      const img = imgRef.current
      if (!img) {
        return
      }
      const aspect = img.naturalWidth / img.naturalHeight
      aspectRef.current = aspect
      const size = {
        width: img.width,
        height: img.height,
      }
      setSize(size)
      setAspect(aspect)
      if (!element.size) {
        const path = ReactEditor.findPath(editor, element)
        Editor.withoutNormalizing(editor, () => {
          Transforms.setNodes<Image & ImageExtension>(editor, { size }, { at: path })
        })
      }
    }, [loaded])

    // resize image to fit parent size
    const onElementResize = useCallback(() => {
      const img = imgRef.current
      if (!img) {
        return
      }
      img.height = img.clientWidth / (aspectRef.current ?? 1)
    }, [])

    // add size observer (use window.onresize instead of ResizeObserver if not exists)
    useEffect(() => {
      if (!readonly || (!loaded && !isImgOk(imgRef.current))) {
        return
      }
      onElementResize()
      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', onElementResize)
        return () => {
          window.removeEventListener('resize', onElementResize)
        }
      } else {
        if (imgRef.current) {
          const ro = new ResizeObserver(onElementResize)
          ro.observe(imgRef.current)
        }
      }
    }, [readonly, loaded])

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
            height={size?.height}
            ref={imgRef}
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
              ref={imgRef}
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
  insert: (editor, location, params: RemarkElementProps<Image>) => {
    Transforms.insertNodes(editor, [
      { text: ' ' },
      { type: 'image', children: [], ...params },
      { text: ' ' },
    ], { at: location })
  },
} as Omit<ICustomInlineElementConfig<Image, Record<string, unknown>>, 'register'>)

export default ImageNode
