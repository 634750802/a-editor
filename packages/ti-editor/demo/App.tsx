import TiEditor, { createFactory } from '@/index';
import { EditorFactory } from '@/slate-markdown/core/editor-factory';
import React, { ChangeEvent, useCallback, useState } from 'react';
import { Descendant, Transforms } from 'slate';
import './app.less';
import { HistoryEditor } from 'slate-history';
import { instructionsMd } from './instructions';
import { TiRemark } from "@pingcap-inc/tidb-community-remark";

function config(factory: EditorFactory) {
  factory.onEditorMounted(editor => {
    setTimeout(() => {
      HistoryEditor.withoutSaving(editor, () => {
        Transforms.select(editor, [0])
        const fragment = (factory as EditorFactory & TiRemark).parseMarkdown(instructionsMd);
        (factory as EditorFactory & TiRemark).generateHeadingId(fragment);
        editor.insertFragment(fragment)
      })
    }, 0)
  })
}

async function uploadFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function () {
      setTimeout(() => {
        resolve(reader.result as string);
      }, 500);
    };
    reader.onerror = function () {
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}

const factory = createFactory(config);

function App(): JSX.Element {

  const [value, setValue] = useState<Descendant[]>([{ type: 'paragraph', children: [{ text: 'test' }]}]);
  const [disabled, setDisabled] = useState(false)

  const onChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);
  }, [value]);
  
  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDisabled(e.target.checked)
  }, [])

  return (
    <div>
      <label>
        <span>
          Disabled
        </span>

        <input
          checked={disabled}
          onChange={onInputChange}
          type='checkbox'
        />
      </label>

      <TiEditor
        disabled={disabled}
        factory={factory}
        onChange={onChange}
        uploadFile={uploadFile}
        value={value}
      />
    </div>
  );
}

export default App;
