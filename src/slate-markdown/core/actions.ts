import { KeyboardEvent, SyntheticEvent } from 'react'
import { Editor, Location, Node, Path, Range, Text } from 'slate'
import { EditorFactory } from '@/slate-markdown/core/editor-factory'
import { MdastContentType } from '@/slate-markdown/core/elements'
import { createSyntheticEvent } from '@/utils/react'
import { TextNodeDecorator } from '@/slate-markdown/elements/text/TextNode'
import { override } from '@/utils/override'
import isHotkey from 'is-hotkey'

declare module '../../components/ti-editor/TiEditor' {
  interface TiEditor {
    runActionParams: unknown

    runAction (key: string, location: Location | undefined, event?: SyntheticEvent): boolean

    getActions (location?: Location, keys?: string[]): ActionInstance<never, Record<string, unknown>>[]
  }
}

declare module './editor-factory' {
  interface EditorFactory {
    lineActions: string[][]
    selectionActions: string[]

    defineAction: <K extends keyof ActionTypeMap, P extends Record<string, unknown>> (config: BaseActionConfig<K, P>) => void
    actionMap: Map<string, BaseAction<keyof ActionTypeMap, Record<string, unknown>>>
    actions: BaseAction<never, Record<string, unknown>>[]
    actionTypes: {
      [ActionType.selection]: BaseAction<never, Record<string, unknown>>[],
      [ActionType.phrasing]: BaseAction<never, Record<string, unknown>>[],
      [ActionType.toplevel]: BaseAction<never, Record<string, unknown>>[],
    }
    actionHotKeysHas: (event: KeyboardEvent) => string | undefined
  }
}

export const enum ActionType {
  selection = 'selection',
  phrasing = 'phrasing',
  toplevel = 'toplevel'
}

export type TopLevelPath = [number]

type ActionTypeMap = {
  [ActionType.selection]: Range,
  [ActionType.phrasing]: Path,
  [ActionType.toplevel]: TopLevelPath
}

export type BaseActionState = {
  disabled: boolean
  active: boolean
}

export type ActionState<P> = BaseActionState & P

export type ActionStateRenderer<P extends Record<string, unknown>> = (state: ActionState<P>) => JSX.Element

export interface BaseActionConfig<K extends keyof ActionTypeMap, P extends Record<string, unknown> = Record<string, never>> {
  key: string
  type: K
  hotkeys?: string[]
  icon?: JSX.Element | ActionStateRenderer<P>
  tips?: JSX.Element | ActionStateRenderer<P>
  defaultParams?: P
  // defaults to () => ({ active: false, disabled: false, ...defaultParams })
  computeState?: (editor: Editor, location: ActionTypeMap[K]) => ActionState<P>
  action: (editor: Editor, location: ActionTypeMap[K], state: ActionState<P>, event: SyntheticEvent) => boolean
}

export interface BaseAction<K extends keyof ActionTypeMap = keyof ActionTypeMap, P extends Record<string, unknown> = Record<string, unknown>> {
  key: string
  type: K
  hotkeys: string[]
  icon: JSX.Element | ActionStateRenderer<P> | null
  tips: JSX.Element | ActionStateRenderer<P> | null
  computeState: (editor: Editor, location: ActionTypeMap[K]) => ActionState<P>
  action: (editor: Editor, location: ActionTypeMap[K], event: SyntheticEvent) => boolean
}

export interface ActionInstance<K extends keyof ActionTypeMap, P extends Record<string, unknown>> {
  action: BaseAction<K, P>
  state: ActionState<P>
}

export interface PreActionHook<K extends keyof ActionTypeMap, P extends Record<string, unknown> = Record<string, never>> {
  (editor: Editor, location: ActionTypeMap[K], action: BaseAction<K, P>, state: BaseActionState, event: SyntheticEvent): boolean
}

export interface PostActionHook<K extends keyof ActionTypeMap, P extends Record<string, unknown>> {
  (editor: Editor, location: ActionTypeMap[K], action: BaseAction<K, never>, params: P, event: SyntheticEvent): void
}

export function createAction<K extends keyof ActionTypeMap, P extends Record<string, unknown>> ({ key, type, tips, defaultParams = {} as never, action, computeState, hotkeys, icon }: BaseActionConfig<K, P>): BaseAction<K, P> {
  const defaultState = { active: false, disabled: false, ...defaultParams }

  const baseAction: BaseAction<K, P> = {
    key,
    type,
    hotkeys: hotkeys ?? [],
    tips: tips ?? null,
    icon: icon ?? null,
    computeState: computeState ?? (() => defaultState),
    action: (editor, location, event) => {
      const state = baseAction.computeState(editor, location)
      console.log('run action', key, location, state)
      if (state.disabled) {
        return false
      }
      return action(editor, location, state, event)
    },
  }

  return baseAction
}


export function getActionLocation<K extends keyof ActionTypeMap> (editor: Editor, actionType: K, from: Location | undefined): ActionTypeMap[K] | undefined {
  let location = from ?? editor.selection

  if (!location) {
    return undefined
  }
  if (Range.isRange(location)) {
    location = Editor.unhangRange(editor, location)
  }
  switch (actionType) {
    case ActionType.phrasing: {
      const p = Editor.path(editor, location)
      const node = Node.get(editor, p)
      const nodeModelType = editor.getContentModelType(node)
      if (nodeModelType === MdastContentType.phrasing) {
        return p as ActionTypeMap[K]
      }
      // which is a flow node.
      if (!Text.isText(node) && editor.getContentType(node) === MdastContentType.flow) {
        return p as ActionTypeMap[K]
      }
      for (const [node, path] of Node.ancestors(editor, p)) {
        if (editor.getContentModelType(node) === MdastContentType.phrasing) {
          return path as ActionTypeMap[K]
        }
      }
      break
    }
    case ActionType.selection:
      return Editor.range(editor, location) as ActionTypeMap[K]
    case ActionType.toplevel: {
      const p = Editor.path(editor, location)
      if (p.length >= 1) {
        return [p[0]] as ActionTypeMap[K]
      }
      break
    }
  }
  return undefined
}

export function coreActionsPlugin (factory: EditorFactory): void {
  factory.actions = []
  factory.actionMap = new Map()
  factory.actionTypes = {
    [ActionType.selection]: [],
    [ActionType.phrasing]: [],
    [ActionType.toplevel]: [],
  }
  const hotkeyMaps = new Map<string, string>()

  factory.defineAction = (config) => {
    const baseAction = createAction(config)
    factory.actionMap.set(baseAction.key, baseAction as never)
    factory.actionTypes[baseAction.type].push(baseAction as never)
    factory.actions.push(baseAction as never)
    for (const hotkey of baseAction.hotkeys) {
      hotkeyMaps.set(hotkey, baseAction.key)
    }
  }

  factory.actionHotKeysHas = (event: KeyboardEvent) => {
    for (const key of hotkeyMaps.keys()) {
      if (isHotkey(key, event)) {
        return key
      }
    }
    return undefined
  }

  factory.onWrapEditor(editor => {
    editor.runAction = (key, location, event) => {
      const action = factory.actionMap.get(key)
      if (!action) {
        return false
      }
      location = getActionLocation(editor, action.type, location)
      if (!location) {
        return false
      }
      const realLocation = location
      let res!: boolean
      Editor.withoutNormalizing(editor, () => {
        res = action.action(editor, realLocation, event ?? createSyntheticEvent(new Event('fake')))
      })
      return res
    }

    editor.getActions = (location, keys) => {
      let actions = factory.actions
      if (keys) {
        actions = keys.map(key => factory.actionMap.get(key)).filter(action => !!action) as never
      }
      const locations = {
        [ActionType.toplevel]: getActionLocation(editor, ActionType.toplevel, location),
        [ActionType.selection]: getActionLocation(editor, ActionType.selection, location),
        [ActionType.phrasing]: getActionLocation(editor, ActionType.phrasing, location),
      }

      return actions.map(action => {
        const location = locations[action.type]
        const state = location ? action.computeState(editor, location) : { active: false, disabled: true }
        return {
          state,
          action,
        }
      })
    }
  })

  override(factory, 'createDefaultEditableProps', (props) =>
    editor =>
      override(props(editor), 'onKeyDown', onKeyDown =>
        event => {
          const action = factory.actionHotKeysHas(event)
          if (action && editor.runAction(action, undefined, event)) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
          onKeyDown?.(event)
        }))

  if (!factory.lineActions) {
    factory.lineActions = [
      ['toggle-heading-1', 'toggle-heading-2', 'toggle-heading-3', 'toggle-heading-4', 'toggle-heading-5', 'toggle-heading-6'],
      ['toggle-ordered-list', 'toggle-unordered-list', 'indent-list', 'outdent-list'],
      ['toggle-blockquote', 'toggle-codeblock', 'toggle-table'],
    ]
  }
  if (!factory.selectionActions) {
    factory.selectionActions = [
      TextNodeDecorator.strong,
      TextNodeDecorator.emphasis,
      TextNodeDecorator.delete,
      TextNodeDecorator.inlineCode,
      'toggle-link',
      'toggle-image',
      'remove-selection-table',
      'table-insert-row-right',
      'table-insert-row-left',
      'table-insert-row-above',
      'table-insert-row-below',
      'table-delete-row',
      'table-delete-col',
    ]
  }
}
