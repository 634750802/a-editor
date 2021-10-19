import { EditorFactory } from '/src/slate-markdown/core/editor-factory'
import el from './register-elements'
import remarkSectionPlugin from '/src/plugins/layout/remark-utils'
import { CustomBlockElements } from '/src/slate-markdown/core/elements'
import { Descendant, Editor, Node, Path, PathRef, Range, Transforms } from 'slate'
import { isElementType } from '/src/slate-markdown/slate-utils'
import { HistoryEditor } from 'slate-history'

declare module '/src/components/ti-editor/TiEditor' {
  interface TiEditor {
    getSectionRange (index: number): Range | undefined

    setSection (index: number, fragment: Descendant[]): void

    getSection (index: number): Descendant[]

    setSectionMarkdown (index: number, fragment: string): void

    getSectionMarkdown (index: number): string
  }
}

declare module '/src/slate-markdown/core/editor-factory' {
  interface EditorFactory {
    configSections (sections: CustomBlockElements['section'][]): void
  }
}

export default function layoutPlugin (factory: EditorFactory): void {
  el.register(factory)

  factory.configSerializeProcessor(remarkSectionPlugin)

  let configuredSections: CustomBlockElements['section'][] = []

  factory.configSections = (sections: CustomBlockElements['section'][]) => {
    configuredSections = sections
  }

  factory.onWrapEditor(editor => {
    const { normalizeNode, deleteFragment, deleteBackward, deleteForward, insertFragment, runAction } = editor

    const pathRefs: PathRef[] = []

    editor.insertFragment = fragment => {
      insertFragment(fragment.filter(node => !isElementType(node, 'section')))
    }

    editor.runAction = (key, location, event) => {
      if (location) {
        const range = Editor.range(editor, location)
        let exists = false
        for (const pathRef of pathRefs) {
          if (pathRef.current && Range.includes(range, pathRef.current)) {
            exists = true
            break
          }
        }
        if (exists) {
          editor.onAlert('无法操作固定内容', '')
          return false
        }
      }
      return runAction(key, location, event)
    }

    editor.deleteFragment = (dir) => {
      if (editor.selection) {
        let exists = false
        for (const pathRef of pathRefs) {
          if (pathRef.current && Range.includes(editor.selection, pathRef.current)) {
            exists = true
            break
          }
        }
        if (exists) {
          editor.onAlert('无法删除固定内容', '')
          return
        }
      }
      deleteFragment(dir)
    }

    editor.deleteBackward = (unit) => {
      if (editor.selection) {
        const point = Editor.before(editor, editor.selection, { unit })
        if (point) {
          if (isElementType(Editor.node(editor, point, { depth: 1 })[0], 'section')) {
            editor.onAlert('无法删除固定内容', '')
            return
          }
        }
      }
      deleteBackward(unit)
    }

    editor.deleteForward = (unit) => {
      if (editor.selection) {
        const point = Editor.after(editor, editor.selection, { unit })
        if (point) {
          if (isElementType(Editor.node(editor, point, { depth: 1 })[0], 'section')) {
            editor.onAlert('无法删除固定内容', '')
            return
          }
        }
      }
      deleteForward(unit)
    }

    const insertSection = (section: CustomBlockElements['section']): PathRef => {
      let pathIndex = 0
      if (editor.selection) {
        pathIndex = editor.selection.focus.path[0]
      }
      Transforms.insertNodes(editor, [section, { type: 'paragraph', children: [{ text: '' }] }], { at: [pathIndex] })
      return Editor.pathRef(editor, [pathIndex])
    }

    const forceLayout = () => {
      let changed = false
      HistoryEditor.withoutSaving(editor, () => {
        Editor.withoutNormalizing(editor, () => {
          if (configuredSections.length) {
            if (pathRefs.length === 0) {
              for (let i = configuredSections.length - 1; i >= 0; --i) {
                pathRefs[i] = insertSection(configuredSections[i])
              }
              return
            } else {
              for (let i = configuredSections.length - 1; i >= 0; --i) {
                const pathRef = pathRefs[i]
                if (pathRef.current) {
                  if (!isElementType(Node.get(editor, pathRef.current), 'section')) {
                    pathRef.unref()
                    pathRefs[i] = insertSection(configuredSections[i])
                    changed = true
                  }
                } else {
                  pathRef.unref()
                  pathRefs[i] = insertSection(configuredSections[i])
                  changed = true
                }
              }
              if (changed) {
                return
              }
            }
          }
        })
      })
      return changed
    }

    editor.normalizeNode = (entry) => {
      if (!forceLayout()) {
        normalizeNode(entry)
      }
    }

    Object.defineProperty(editor, 'markdown', {
      get () {
        console.warn('editor.markdown was disabled for layout plugin, use editor.getSectionMarkdown instead')
      },
      set () {
        console.warn('editor.markdown was disabled for layout plugin, use editor.setSectionMarkdown instead')
      },
    })

    editor.getSectionRange = i => {
      if (i >= pathRefs.length) {
        return undefined
      }
      let start = pathRefs[i].current
      if (!start) {
        return undefined
      }
      let end: Path | null
      if (i < pathRefs.length - 1) {
        end = pathRefs[i + 1].current
      } else {
        end = [editor.children.length - 1]
      }
      if (!end) {
        return undefined
      }
      start = Path.next(start)
      end = Path.previous(end)
      if (Path.isBefore(end, start)) {
        end = start
      }
      return { anchor: Editor.start(editor, start), focus: Editor.end(editor, end) }
    }

    editor.getSection = i => {
      const range = editor.getSectionRange(i)
      if (!range) {
        return []
      }
      return Editor.fragment(editor, range)
    }

    editor.getSectionMarkdown = (i) => {
      return factory.generateMarkdown(editor.getSection(i))
    }

    editor.setSection = (i, fragments) => {
      const range = editor.getSectionRange(i)
      if (!range) {
        return
      }
      Transforms.select(editor, range)
      editor.insertFragment(fragments)
    }

    editor.setSectionMarkdown = (i, markdown) => {
      editor.setSection(i, factory.parseMarkdown(markdown))
    }
  })

  factory.onEditorMounted((editor) => {
    Editor.normalize(editor, { force: true })
  })

}
