import { Blockquote, Code, Heading, Image, InlineMath, Link, List, ListItem, Paragraph, Table, TableCell, TableRow, Text, ThematicBreak } from 'remark-slate-transformer/lib/transformers/mdast-to-slate'
import { BaseElement, Editor, Element as SlateElement, Location, NodeEntry, Path, Range, Text as SlateText } from 'slate'
import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import { ToolbarItemProps } from '/src/components/hovering-toolbar/getHoveringToolItems'
import { SyntheticEvent } from 'react'
import { SYMBOL_PRISM_TOKEN } from '/src/slate-markdown/elements/code/CodeNode'

export interface CustomBlockElements {
  [key: string]: { type: string } & BaseElement
}

export type RemarkBlockElement = List | ListItem | Paragraph | Code | Heading | Blockquote | ThematicBreak | Table | TableRow | TableCell | CustomBlockElements[keyof CustomBlockElements]
export type RemarkInlineElement = InlineMath | Image | Link
export type RemarkElement = RemarkBlockElement | RemarkInlineElement
export type RemarkText = Text & { [SYMBOL_PRISM_TOKEN]?: string }
export type RemarkElementToggleParams<E extends RemarkElement, P extends Omit<E, 'type' | 'children'> = Omit<E, 'type' | 'children'>> =
  P extends Record<string, never> ? boolean : P | false
export type RemarkElementProps<E extends RemarkElement, P extends Omit<E, 'type' | 'children'> = Omit<E, 'type' | 'children'>> =
  P extends Record<string, never> ? void : P

export type CustomElementNormalizer<E extends SlateElement | SlateText> = (editor: Editor, element: E, path: Path, preventDefaults: () => void) => void
export type TypedRenderElementProps<E extends RemarkElement> = RenderElementProps & {
  element: E
}
export type TypedRenderLeafProps<T extends RemarkText> = RenderLeafProps & {
  leaf: T
  text: T
}


export const enum MdastContentType {
  flow = 0x10,
  list = 0x20,
  phrasing = 0x30, // should it be same with inline?
  staticPhrasing = 0x31, // should it be same with inline?
  value = 0x40, // has raw text value
  // gfm table
  table = 0x50,
  tableRow = 0x60
}

export function isContentTypeConforms (type: MdastContentType, toType: MdastContentType): boolean {
  return type === toType || (type < toType && (type ^ toType) < 0x10)
}

// returns true represents this event was consumed
export type BlockEventHandler = (editor: Editor, path: Path) => boolean

export type CustomBlockElementEvents = {
  // returns new toggle params to indicate event was consumed and stop this round of handlers
  onTab?: BlockEventHandler
  onStartDelete?: BlockEventHandler
  onStartEnter?: BlockEventHandler
}

export type CustomBlockElementToggle<T> = {
  // when triggered by prefix, gen a params or not call toggle by returns undefined
  // type <prefix> and a space to trigger toggle
  estimatePrefixLength?: number
  prefix: RegExp
  onTrigger: (prefix: string, editor: Editor, path: Path) => T | undefined
  indent?: (editor: Editor, path: Path, delta: 1 | -1) => void
  toggle: (editor: Editor, path: Path, params: T) => void
} | Record<string, never>

export interface ICustomConfig<E extends SlateElement | SlateText> {
  isLeaf: boolean
  contentType: MdastContentType
  contentModelType: MdastContentType | null

  normalize?: CustomElementNormalizer<E>

  register (editorFactory: EditorFactory): void
}

export interface ICustomElementConfig<E extends RemarkElement> extends ICustomConfig<E> {
  isLeaf: false
  type: E['type']
  isInline: boolean

  render (editor: Editor, props: TypedRenderElementProps<E>): JSX.Element
}

export interface ICustomBlockElementConfig<E extends RemarkBlockElement> extends ICustomElementConfig<E> {
  isInline: false

  toggle: CustomBlockElementToggle<RemarkElementToggleParams<E>>
  events: CustomBlockElementEvents

  // heading is not while blockquote and listItem are.
  // deprecated: uses contentModelType: 'phrasing'
  wrappingParagraph: boolean
  toolbarItems: ToolbarItemConfig<Path>[]

  decorate?: (editor: Editor, entry: NodeEntry, el: E) => Range[]
}

export type CustomInlineMatch = {
  regexp: RegExp
} | Record<string, never>

export interface ICustomInlineElementConfig<E extends RemarkInlineElement, P = Record<string, unknown>> extends ICustomElementConfig<E> {
  isInline: true

  insert: (editor: Editor, location: Location, params: RemarkElementProps<E & P>) => void

  match?: CustomInlineMatch

  toolbarItems: ToolbarItemConfig[]
}

export interface ICustomTextConfig<T extends RemarkText> extends ICustomConfig<T> {
  isLeaf: true

  render (editor: Editor, props: TypedRenderLeafProps<T>): JSX.Element

  toolbarItems: ToolbarItemConfig[]
}

export interface ToolbarItemConfig<R = Range> extends Omit<ToolbarItemProps, 'active' | 'disabled' | 'action'> {
  action: (editor: Editor, range: R, event: SyntheticEvent) => void
  isActive: (editor: Editor, range: R) => boolean
  isDisabled: (editor: Editor, range: R) => boolean
}

type AnyConfig =
  ICustomBlockElementConfig<RemarkBlockElement>
  | ICustomInlineElementConfig<RemarkInlineElement>
  | ICustomTextConfig<RemarkText>


export function defineNode<E extends RemarkBlockElement> (config: Omit<ICustomBlockElementConfig<E>, 'register'>): ICustomBlockElementConfig<E>
export function defineNode<E extends RemarkInlineElement, P = Record<string, unknown>> (config: Omit<ICustomInlineElementConfig<E, P>, 'register'>): ICustomInlineElementConfig<E, P>
export function defineNode<T extends RemarkText, P = Record<string, unknown>> (config: Omit<ICustomTextConfig<T> & P, 'register'>): ICustomTextConfig<T> & P
export function defineNode<C extends AnyConfig> (config: Omit<C, 'register'>): C {
  return {
    ...config,
    register (editorFactory: EditorFactory) {
      editorFactory.define(config as never)
    },
  } as C
}
