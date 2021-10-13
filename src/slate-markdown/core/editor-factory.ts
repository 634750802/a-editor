import { BlockEventHandler, CustomBlockElementEvents, ICustomBlockElementConfig, ICustomElementConfig, ICustomInlineElementConfig, ICustomTextConfig, RemarkBlockElement, RemarkInlineElement, RemarkText, TypedRenderLeafProps } from '/src/slate-markdown/core/elements'
import { Editor, Element, Node, Path, Point, Range, Text, Transforms } from 'slate'
import type { EditableProps } from 'slate-react/dist/components/editable'
import { createElement, KeyboardEvent } from 'react'
import isHotkey from 'is-hotkey'
import TextNode, { TextNodeDecorator } from '/src/slate-markdown/elements/text/TextNode'

export class EditorFactory<T extends RemarkText = RemarkText, BE extends RemarkBlockElement = RemarkBlockElement, IE extends RemarkInlineElement = RemarkInlineElement> {
  private blockConfigs: ICustomBlockElementConfig<BE>[] = []
  private inlineConfigs: ICustomInlineElementConfig<IE>[] = []
  private textConfig!: ICustomTextConfig<T>

  private inlineSet: Set<string> = new Set()
  private voidSet: Set<string> = new Set()

  private customElementMap: Map<string, ICustomElementConfig<IE | BE>> = new Map()

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
      if (config.isVoid) {
        this.voidSet.add(config.type)
      }
    }
    return this
  }

  wrapEditor<E extends Editor> (editor: E): E {
    const { isVoid, isInline, normalizeNode } = editor

    editor.shouldUpdatePopper = () => {
    }

    editor.isVoid = element => this.voidSet.has(element.type) || isVoid(element)
    editor.isInline = element => this.inlineSet.has(element.type) || isInline(element)
    editor.normalizeNode = (entry) => {
      let shouldNormalizeDefaults = true
      Editor.withoutNormalizing(editor, () => {
        debugPrintTree(editor)
        const [node, path] = entry
        if (Element.isElement(node)) {
          const normalize = this.customElementMap.get(node.type)?.normalize
          if (normalize) {
            normalize(editor, node as never, path, () => {
              shouldNormalizeDefaults = false
            })
          }
        }
      })
      if (shouldNormalizeDefaults) {
        normalizeNode(entry)
      }
    }

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
                console.log(toggle.prefix, 'go', this.blockConfigs)
                if (toggle.prefix?.test(prefix)) {
                  console.log(toggle.prefix, 'go')
                  const params = toggle.onTrigger(prefix)
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
              console.log(event)
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
          if (isHotkey('enter', event)) {
            if (editor.selection) {
              const el = Node.parent(editor, editor.selection.anchor.path)
              if (Editor.isBlock(editor, el)) {
                // TODO add by element config
                if (!/paragraph|heading/.test(el.type)) {
                  Transforms.insertText(editor, '\n')
                  event.preventDefault()
                  return
                }
              }
            }
          }
          if (isHotkey('meta+b', event)) {
            TextNode.toggleDecorator(editor, TextNodeDecorator.strong)
            event.preventDefault()
            return
          }
          if (isHotkey('meta+i', event)) {
            TextNode.toggleDecorator(editor, TextNodeDecorator.emphasis)
            event.preventDefault()
            return
          }
        })
      },
      onSelect: event => {
        editor.shouldUpdatePopper()
      },
    }
  }
}

function isFirstTextPoint (editor: Editor, point: Point): boolean {
  return point.offset === 0
    && !Path.hasPrevious(point.path)
    && Text.isText(Node.get(editor, point.path))
}

function batch (editor: Editor, fn: (preventNormalizing: () => void) => void) {
  debugPrintTree(editor)
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

function debugPrintTree (node: Node): void {
  // if (Editor.isEditor(node)) {
  //   console.group('#root')
  //   node.children.forEach(debugPrintTree)
  //   console.groupEnd()
  // } else if (Element.isElement(node)) {
  //   console.group(node.type)
  //   node.children.forEach(debugPrintTree)
  //   console.groupEnd()
  // } else {
  //   console.debug('text')
  // }
}
