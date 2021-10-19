import { BlockEventHandler, CustomBlockElementEvents, ICustomBlockElementConfig, ICustomElementConfig, ICustomInlineElementConfig, ICustomTextConfig, isContentTypeConforms, MdastContentType, RemarkBlockElement, RemarkElement, RemarkElementProps, RemarkInlineElement, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Ancestor, Descendant, Editor, Element, Node, NodeEntry, Path, Point, Range, Text, Transforms } from 'slate'
import type { EditableProps } from 'slate-react/dist/components/editable'
import { ClipboardEvent, createElement, Dispatch, DragEvent, KeyboardEvent, SetStateAction } from 'react'
import isHotkey from 'is-hotkey'
import TextNode, { TextNodeDecorator } from '/src/slate-markdown/elements/text/TextNode'
import LinkNode from '/src/slate-markdown/elements/link/LinkNode'
import DecorationStack from '/src/slate-markdown/core/decoration-stack'
import { ReactEditor } from 'slate-react'
import { isElementType } from '/src/slate-markdown/slate-utils'
import { ToggleStrategy } from '/src/components/ti-editor/TiEditor'
import { Plugin, Processor, unified } from 'unified'
import { remarkToSlate, slateToRemark } from 'remark-slate-transformer'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import remarkGfm from 'remark-gfm'
import rfdc from 'rfdc'

const clone = rfdc({ proto: false, circles: false })

type ProcessorHandler = (processor: Processor) => void

export class EditorFactory<T extends RemarkText = RemarkText, BE extends RemarkBlockElement = RemarkBlockElement, IE extends RemarkInlineElement = RemarkInlineElement> {
  readonly blockConfigs: ICustomBlockElementConfig<BE>[] = []
  readonly inlineConfigs: ICustomInlineElementConfig<IE>[] = []
  private textConfig!: ICustomTextConfig<T>

  private inlineSet: Set<string> = new Set()
  private voidSet: Set<string> = new Set()

  readonly customElementMap: Map<string, ICustomElementConfig<IE | BE>> = new Map()
  readonly contentTypeMap: Map<string, MdastContentType> = new Map()
  readonly contentModelTypeMap: Map<string, MdastContentType | null> = new Map()

  private serializerPlugins: Plugin[] = []
  private deserializerPlugins: Plugin[] = []

  private serializeProcessor: Processor = unified()
  private deserializeProcessor: Processor = unified()
  private deserializeHTMLProcessor: Processor = unified()


  freezeProcessors () {
    this.serializeProcessor.use(this.serializerPlugins).use(slateToRemark).use(remarkGfm).use(remarkStringify, {
      emphasis: '*',
      strong: '*',
      listItemIndent: 'one',
      fence: '`',
      bullet: '-',
    }).freeze()
    this.deserializeProcessor.use(remarkParse).use(remarkGfm).use(remarkToSlate).use(this.deserializerPlugins).freeze()
    this.deserializeHTMLProcessor.use(rehypeParse).use(rehypeRemark).use(remarkGfm).use(remarkToSlate).use(this.deserializerPlugins).freeze()
  }

  configProcessor (...plugins: Plugin[]) {
    this.configSerializeProcessor(...plugins)
    this.configDeserializeProcessor(...plugins)
  }

  configSerializeProcessor (...plugins: Plugin []) {
    this.serializerPlugins.push(...plugins)
  }

  configDeserializeProcessor (...plugins: Plugin[]) {
    this.deserializerPlugins.push(...plugins)
  }

  use (plugin: (factory: this) => void): this {
    plugin(this)
    return this
  }

  define (config: ICustomInlineElementConfig<IE>): this
  define<T> (config: ICustomBlockElementConfig<BE>): this
  define (config: ICustomTextConfig<T>): this
  define (config: ICustomInlineElementConfig<IE> | ICustomBlockElementConfig<BE> | ICustomTextConfig<T>): this {
    if (config.isLeaf) {
      this.textConfig = config
    } else {
      if (config.isInline) {
        this.inlineSet.add(config.type)
        this.inlineConfigs.push(config)
      } else {
        this.blockConfigs.push(config)
      }
      this.customElementMap.set(config.type, config as never)
      this.contentModelTypeMap.set(config.type, config.contentModelType)
      this.contentTypeMap.set(config.type, config.contentType)
      if (config.contentModelType === null) {
        this.voidSet.add(config.type)
      }
    }
    return this
  }

  private editorWrapHandlers: ((editor: Editor) => void)[] = []

  onWrapEditor (handler: (editor: Editor) => void) {
    this.editorWrapHandlers.push(handler)
  }

  private editorMountedHandlers: ((editor: Editor) => void)[] = []

  onEditorMounted (handler: (editor: Editor) => void) {
    this.editorMountedHandlers.push(handler)
  }

  triggerEditorMounted (editor: Editor) {
    this.editorMountedHandlers.forEach(handler => handler(editor))
  }

  generateMarkdown (fragment: Descendant[]): string {
    return this.serializeProcessor.stringify(this.serializeProcessor.runSync({
      type: 'root',
      children: clone(fragment), // processors may change the ast.
    } as never)) as string
  }

  parseMarkdown (value: string): Descendant[] {
    return this.deserializeProcessor.processSync(value).result as Descendant[]
  }

  wrapEditor<E extends Editor> (editor: E, setValue: Dispatch<SetStateAction<Descendant[]>>): E {
    const { isVoid, isInline, normalizeNode, insertBreak, insertFragment, setFragmentData } = editor

    editor.factory = this as never

    function debugPrintTree (node: Node): void {
      if (Editor.isEditor(node)) {
        console.group('#root')
        node.children.forEach(debugPrintTree)
        console.groupEnd()
      } else if (Element.isElement(node)) {
        console.group(node.type)
        node.children.forEach(debugPrintTree)
        console.groupEnd()
      } else {
        console.debug('text')
      }
    }

    (window as any).debugPrintTree = () => debugPrintTree(editor);
    (window as any).debugEditor = editor

    Object.defineProperty(editor, 'markdown', {
      enumerable: false,
      configurable: true,
      get: () => {
        return this.generateMarkdown(editor.children)
      },
      set: (value) => {
        setValue(this.parseMarkdown(value))
        Editor.setNormalizing(editor, true)
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    editor.updatePopper = editor.hidePopper = editor.togglePopper = () => {
    }

    editor.isContent = (node, type): node is Element | Text => {
      if (Element.isElement(node)) {
        return this.contentTypeMap.get(node.type) === type
      } else if (Text.isText(node)) {
        return this.textConfig.contentType === type
      } else {
        return false
      }
    }

    editor.canContainsContent = (node, type): node is Element | Editor | Text => {
      if (Editor.isEditor(node)) {
        // https://github.com/syntax-tree/mdast#root
        return type === MdastContentType.flow
      } else if (Element.isElement(node)) {
        const nodeContentModelType = this.contentModelTypeMap.get(node.type)
        if (!nodeContentModelType) {
          return false
        }
        return isContentTypeConforms(type, nodeContentModelType)
      } else if (Text.isText(node)) {
        return isContentTypeConforms(type, TextNode.canContainsContentModelTypeOf(node))
      } else {
        return false
      }
    }

    editor.getContentType = node => {
      if (Element.isElement(node)) {
        return this.contentTypeMap.get(node.type) || null
      } else if (Text.isText(node)) {
        return this.textConfig.contentType || null
      } else {
        return null
      }
    }

    editor.getContentModelType = node => {
      if (Editor.isEditor(node)) {
        return MdastContentType.flow
      } else if (Element.isElement(node)) {
        return this.contentModelTypeMap.get(node.type) || null
      } else if (Text.isText(node)) {
        return this.textConfig.contentModelType
      } else {
        return null
      }
    }

    editor.getContentTypePair = node => {
      if (Element.isElement(node)) {
        return [this.contentTypeMap.get(node.type) || null, this.contentModelTypeMap.get(node.type) || null]
      } else if (Text.isText(node)) {
        return [this.textConfig.contentType || null, this.textConfig.contentModelType || null]
      } else {
        return [null, null]
      }
    }

    // this is important
    editor.toggle = (entry, config, params): boolean => {
      const canToggle = editor.canToggle(entry, config, true)
      if (!canToggle) {
        return false
      }
      const [[node, path], toggleStrategy] = canToggle
      const realParams = typeof params === 'object' ? params : {}
      switch (toggleStrategy) {
        case ToggleStrategy.replace:
          Transforms.unsetNodes(editor, Object.keys(Node.extractProps(node)), { at: path })
          Transforms.setNodes(editor, { type: config.type, ...realParams, children: [] }, { at: path })
          return true
        case ToggleStrategy.wrap:
          Transforms.wrapNodes(editor, { type: config.type, ...realParams } as never, { at: path })
          return true
        case ToggleStrategy.custom:
          throw new Error('TODO: ToggleStrategy.custom')
        default:
          throw new Error('unknown ToggleStrategy: ' + toggleStrategy)
      }
    }

    editor.canToggle = (entry, config, ancestors) => {
      const [node] = entry
      const [contentType, contentModelType] = editor.getContentTypePair(node)
      // TODO this is wrong
      if (config.contentType !== contentType) {
        return false
      }
      if (config.contentModelType === contentModelType) {
        return [entry, ToggleStrategy.replace]
      }
      if (config.contentModelType === contentType) {
        return [entry, ToggleStrategy.wrap]
      }

      if (!ancestors) {
        return false
      }
      const entries = Node.ancestors(editor, entry[1], { reverse: true })
      for (const entry of entries) {
        const res = editor.canToggle(entry, config, false)
        if (res) {
          return res
        }
      }
      return false
    }

    editor.unwrap = (entry: NodeEntry, configs: ICustomElementConfig<RemarkElement>[]) => {
      if (!editor.canUnwrap(entry, configs)) {
        return false
      }
      const [node, rootPath] = entry
      const levels: Path[][] = [[[]]]
      let queue: NodeEntry[] = [[node, []]]
      let depth = 0
      while (depth < configs.length - 1) {
        const newQueue: NodeEntry[] = []
        for (const [node, path] of queue) {
          for (const [i, child] of (node as Ancestor).children.entries()) {
            newQueue.push([child, path.concat(i)])
          }
        }

        depth += 1
        queue = newQueue
        levels.push(newQueue.map(([, path]) => path))
      }

      // unwrap from bottom to top to prevent using path refs.
      for (const level of levels.reverse()) {
        for (const path of level.reverse()) {
          Transforms.unwrapNodes(editor, { at: rootPath.concat(path), split: true })
        }
      }
      return true
    }

    editor.canUnwrap = ([node, path]: NodeEntry, configs: ICustomElementConfig<RemarkElement>[]) => {
      if (configs.length === 0) {
        return true
      }
      const parentContentModelType = editor.getContentModelType(Node.parent(editor, path))
      const contentModelType = configs[configs.length - 1].contentModelType
      if (!parentContentModelType || !contentModelType) {
        return false
      }
      if (!isContentTypeConforms(contentModelType, parentContentModelType)) {
        return false
      }
      // bfs checks sub nodes strictly matches the case
      // do not check if contentTypes of configs are compatible, for it is unwrapping.
      let queue: NodeEntry[] = [[node, []]]
      let depth = 0
      while (depth < configs.length) {
        const newQueue: NodeEntry[] = []
        for (const [node, path] of queue) {
          if (!isElementType(node, configs[depth].type)) {
            return false
          }
          for (const [i, child] of node.children.entries()) {
            newQueue.push([child, path.concat(i)])
          }
        }
        depth += 1
        queue = newQueue
      }
      return true
    }

    editor.wrap = (entry: NodeEntry, configs: ICustomElementConfig<RemarkElement>[], params: RemarkElementProps<any>[]) => {
      if (!editor.canWrap(entry, configs, params)) {
        return false
      }
      const [, path] = entry
      let i = configs.length - 1
      while (i >= 0) {
        const config = configs[i]
        const param = params[i]
        Transforms.wrapNodes(editor, Object.assign({ type: config.type, children: [] }, param) as never, { at: path })
        i--
      }
      return true
    }

    editor.canWrap = (entry: NodeEntry, configs: ICustomElementConfig<RemarkElement>[], params: RemarkElementProps<any>[]) => {
      console.assert(configs.length === params.length, 'editor.canWrap: configs.length should be equals to params.length')
      const [node, path] = entry
      const parent = Node.parent(editor, path)
      let i = 0
      let parentContentModelType: MdastContentType | null = editor.getContentModelType(parent)
      while (i < configs.length) {
        const config = configs[i]
        if (parentContentModelType === null || !isContentTypeConforms(config.contentType, parentContentModelType)) {
          return false
        }
        parentContentModelType = config.contentModelType
        i += 1
      }
      if (parentContentModelType === null) {
        return false
      }
      const nodeContentType = editor.getContentType(node)
      if (!nodeContentType) {
        return false
      }
      return isContentTypeConforms(nodeContentType, parentContentModelType)
    }

    editor.nearest = <E extends RemarkElement> (entry: NodeEntry, config: ICustomElementConfig<E>) => {
      const [node, path] = entry
      if (isElementType<E>(node, config.type)) {
        return entry as NodeEntry<E>
      }
      for (const ancestorEntry of Node.ancestors(editor, path, { reverse: true })) {
        if (isElementType<E>(ancestorEntry[0], config.type)) {
          return ancestorEntry as NodeEntry<E>
        }
      }
      return undefined
    }

    editor.getAndRemoveMark = (attr: string) => {
      if (editor.marks) {
        const res = (editor.marks as never)[attr]
        editor.removeMark(attr)
        return res
      }
      return undefined
    }

    editor.isVoid = element => this.voidSet.has(element.type) || isVoid(element)
    editor.isInline = element => this.inlineSet.has(element.type) || isInline(element)
    editor.normalizeNode = (entry) => {
      let shouldNormalizeDefaults = true
      const preventDefaults = () => {
        shouldNormalizeDefaults = false
      }
      Editor.withoutNormalizing(editor, () => {
        const [node, path] = entry
        if (Element.isElement(node)) {
          const normalize = this.customElementMap.get(node.type)?.normalize
          if (normalize) {
            normalize(editor, node as never, path, preventDefaults)
          }
        }
        if (Text.isText(node)) {
          if (this.textConfig.normalize) {
            this.textConfig.normalize(editor, node as never, path, preventDefaults)
          }
        }
        if (Editor.isEditor(node)) {
          if (node.children.length === 0) {
            Transforms.insertNodes(editor, { type: 'paragraph', children: [{text: ''}]}, { at: [0] })
          } else {

            if (!isElementType(node.children[node.children.length - 1], 'paragraph')) {
              Transforms.insertNodes(editor, { type: 'paragraph', children: [{text: ''}]}, { at: [node.children.length] })
            }
          }
        }
      })
      if (shouldNormalizeDefaults) {
        normalizeNode(entry)
      }
    }

    editor.insertBreak = () => {
      if (editor.selection) {
        const el = Node.parent(editor, editor.selection.anchor.path)
        const cmt = editor.getContentModelType(el)
        if (cmt !== MdastContentType.phrasing) {
          Transforms.insertText(editor, '\n')
          return
        }
      }

      insertBreak()
    }

    editor.insertFragment = (fragment) => {
      if (editor.selection) {
        const el = Node.parent(editor, editor.selection.anchor.path)
        const cmt = editor.getContentModelType(el)
        if (cmt === MdastContentType.value) {
          const data = this.serializeProcessor.stringify(this.serializeProcessor.runSync({
            type: 'root',
            children: fragment
          } as never)) as string
          Transforms.insertText(editor, data)
          return
        }
      }

      insertFragment(fragment)
    }

    editor.setFragmentData = (dt) => {
      setFragmentData(dt)
      // copy the markdown content
      dt.setData('text/plain', this.generateMarkdown(editor.getFragment()))
    }

    this.editorWrapHandlers.forEach(handler => handler(editor))

    return editor
  }

  createDefaultEditableProps (editor: Editor): EditableProps {

    const handleInsertText = (event: InputEvent) => {
      const { selection } = editor
      if (selection && Range.isCollapsed(selection)) {
        const point = selection.anchor
        const node = Node.get(editor, point.path)
        const parentNode = Node.parent(editor, point.path)
        if (Text.isText(node) && Element.isElement(parentNode)) {
          if (parentNode.type === 'paragraph') {
            if (event.data === ' ' && !Path.hasPrevious(point.path)) {
              const prefix = node.text.slice(0, point.offset)
              for (const { toggle } of this.blockConfigs) {
                if (typeof toggle.estimatePrefixLength === 'number') {
                  if (prefix.length > toggle.estimatePrefixLength) {
                    continue
                  }
                }
                if (toggle.prefix?.test(prefix)) {
                  const params = toggle.onTrigger(prefix, editor, Path.parent(point.path))
                  if (typeof params !== 'undefined') {
                    Transforms.delete(editor, {
                      at: { path: point.path, offset: 0 },
                      distance: point.offset,
                    })
                    toggle.toggle(editor, Path.parent(point.path), params)
                    event.preventDefault()
                    return
                  }
                }
              }
            }
          }
        }
        if (Text.isText(node) && !isElementType(parentNode, 'link') && event.data === ' ') {
          for (const inlineConfig of this.inlineConfigs) {
            if (inlineConfig.match) {
              const matched = inlineConfig.match.regexp.exec(node.text.slice(0, point.offset))
              if (matched) {
                const url = matched[0]
                const start = matched.index
                const end = matched.index + url.length
                const range = { anchor: { path: point.path, offset: start }, focus: { path: point.path, offset: end } }
                LinkNode.insert(editor, range, { url, title: '', text: url })
                event.preventDefault()
                return
              }
            }
          }
        }
        // like links, if you input at the end of a link, slate will add the text to next text node.
        if (Editor.isInline(editor, parentNode)) {
          const path = Path.parent(point.path).concat(parentNode.children.length)
          Transforms.insertNodes(editor, { text: event.data || '' }, { at: path })
          Transforms.move(editor, { distance: 1 })
          event.preventDefault()
          return
        }
      }
    }

    const withStartEventBlockHandler = (get: ((toggle: CustomBlockElementEvents) => BlockEventHandler | undefined)) => (event: InputEvent) => {
      const { selection } = editor
      if (selection) {
        if (Range.isCollapsed(selection)) {
          const point = selection.anchor
          // is first text node?
          if (isFirstTextPoint(editor, point)) {
            const parentPath = Path.parent(point.path)
            const parentNode = Node.get(editor, parentPath)
            if (Element.isElement(parentNode)) {
              const config = this.customElementMap.get(parentNode.type) as ICustomBlockElementConfig<BE> | undefined
              if (config) {
                const handler = get(config.events)
                if (handler && handler(editor, point.path)) {
                  event.preventDefault()
                  return
                }
              }
              if (parentNode.type === 'paragraph') {
                const grandParentNode = Node.parent(editor, parentPath)
                if (!Path.hasPrevious(parentPath) && Element.isElement(grandParentNode)) {
                  const config = this.customElementMap.get(grandParentNode.type) as ICustomBlockElementConfig<BE> | undefined
                  if (config?.wrappingParagraph) {
                    const handler = get(config.events)
                    if (handler && handler(editor, point.path)) {
                      event.preventDefault()
                      return
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const handleDeleteText = withStartEventBlockHandler(toggle => toggle.onStartDelete)
    const handleInsertParagraph = withStartEventBlockHandler(toggle => toggle.onStartEnter)

    const withCommonEventBlockHandler = (get: ((toggle: CustomBlockElementEvents) => BlockEventHandler | undefined)) => (event: KeyboardEvent) => {
      const { selection } = editor
      if (selection) {
        if (Range.isCollapsed(selection)) {
          const point = selection.anchor
          // is first text node?
          const parentPath = Path.parent(point.path)
          const parentNode = Node.parent(editor, point.path)
          if (Element.isElement(parentNode)) {
            const config = this.customElementMap.get(parentNode.type) as ICustomBlockElementConfig<BE> | undefined
            if (config) {
              const handler = get(config.events)
              if (handler) {
                if (handler(editor, point.path)) {
                  event.preventDefault()
                  return
                }
              }
            }
            // TODO: refactor by mdast content rules
            if (parentNode.type === 'paragraph') {
              const grandParentNode = Node.parent(editor, parentPath)
              if (Element.isElement(grandParentNode)) {
                const config = this.customElementMap.get(grandParentNode.type) as ICustomBlockElementConfig<BE> | undefined
                if (config?.wrappingParagraph) {
                  const handler = get(config.events)
                  if (handler && handler(editor, point.path)) {
                    event.preventDefault()
                    return
                  }
                }
              }
            }
          }
        }
      }
    }

    const onTab = withCommonEventBlockHandler(toggle => toggle.onTab)

    const decorationStack = new DecorationStack(this, editor)

    const decorate = (entry: NodeEntry) => {
      return decorationStack.process(entry)
    }

    const onInsertImage = (images: File[], range: Range | null) => {
      const ref = range ? Editor.rangeRef(editor, range) : null
      if (editor.uploadFile) {
        Promise.all(images.map(editor.uploadFile))
          .then((urls) => urls.map((url, i) => ({
            type: 'image',
            url,
            title: undefined,
            alt: images[i].name,
            children: [{ text: '' }],
          } as Image)))
          .then(fragment => {
            Transforms.insertNodes(editor, fragment, { at: ref?.current ?? Editor.last(editor, [])[1] })
          })
          .catch(console.error)
      }
    }

    const handleFiles = (dt: DataTransfer, range: Range | null) => {
      const images = [...dt.files].filter(file => /image\/*/.test(file.type))
      if (images.length > 0) {
        onInsertImage(images, range)
      }
    }

    const onPaste = (event: ClipboardEvent) => {
      const dt = event.clipboardData
      if (!dt) {
        return
      }
      // from outside of the document
      if (dt.types.indexOf('application/x-slate-fragment') < 0) {
        if (dt.types.indexOf('text/html') >= 0) {
          const htmlData = dt.getData('text/html')
          const nodes = this.deserializeHTMLProcessor.processSync(htmlData).result as Descendant[]
          editor.insertFragment(nodes)
          event.preventDefault()
        } else if (dt.types.indexOf('text/plain') >= 0) {
          const textData = dt.getData('text/plain')
          const nodes = this.deserializeProcessor.processSync(textData).result as Descendant[]
          editor.insertFragment(nodes)
          event.preventDefault()
        }
      }

      handleFiles(dt, editor.selection)
    }

    const onDrop = (event: DragEvent) => {
      handleFiles(event.dataTransfer, ReactEditor.findEventRange(editor, event))
    }

    return {
      renderElement: (props) => {
        const config = this.customElementMap.get(props.element.type)
        if (config) {
          return config.render(editor, props as any)
        } else {
          console.warn(`${props.element.type} not impl`)
          return createElement('div', props.attributes, props.children)
        }
      },
      renderLeaf: (props) => {
        if (this.textConfig) {
          return this.textConfig.render(editor, props as TypedRenderLeafProps<T>)
        } else {
          return createElement('span', props.attributes, props.children)
        }
      },
      decorate,
      onDOMBeforeInput: event => {
        batch(editor, () => {
          console.log(event.inputType)
          switch (event.inputType) {
            case 'insertText':
              handleInsertText(event)
              break
            case 'deleteContentBackward':
              handleDeleteText(event)
              break
            case 'insertParagraph':
              handleInsertParagraph(event)
              break
            case 'insertFromPaste':
              break
          }
        })
      },
      onKeyDown: event => {
        batch(editor, () => {
          if (isHotkey('tab', event)) {
            onTab(event)
            return
          }
          if (isHotkey(['ctrl+enter'], event)) {
            Transforms.insertText(editor, '\n')
            return
          }
          if (editor.selection) {
            if (isHotkey('meta+b', event)) {
              TextNode.toggleDecorator(editor, editor.selection, TextNodeDecorator.strong)
              event.preventDefault()
              return
            }
            if (isHotkey('meta+i', event)) {
              TextNode.toggleDecorator(editor, editor.selection, TextNodeDecorator.emphasis)
              event.preventDefault()
              return
            }
          }
        })
      },
      onSelect: (e) => {
        const selection = window.getSelection()
        if (selection) {
          if (selection.isCollapsed) {
            editor.hidePopper()
          } else if (selection.rangeCount > 0) {
            editor.updatePopper(selection.getRangeAt(0))
          }
        }
      },
      onBlur: (event) => {
        editor.hidePopper()
      },
      onClick: () => {
        const selection = window.getSelection()
        if (selection && selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const slateRange = ReactEditor.toSlateRange(editor, range, { exactMatch: true })
          if (slateRange && editor.selection && Range.equals(slateRange, editor.selection)) {
            editor.togglePopper(range)
          }
        }
      },
      onPaste,
      onDrop,
    }
  }
}

function isFirstTextPoint (editor: Editor, point: Point): boolean {
  return point.offset === 0
    && !Path.hasPrevious(point.path)
    && Text.isText(Node.get(editor, point.path))
}

function batch (editor: Editor, fn: (preventNormalizing: () => void) => void) {
  let prevent = true
  Editor.withoutNormalizing(editor, () => {
    fn(() => {
      prevent = false
    })
  })
  if (!prevent) {
    Editor.normalize(editor)
  }
}
