import TiEditor, { createFactory } from '@/index';
import { EditorFactory } from '@/slate-markdown/core/editor-factory';
import React, { useCallback, useState } from 'react';
import { Descendant } from 'slate';
import './app.less';

function config(factory: EditorFactory) {

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
  const [value, setValue] = useState<Descendant[]>([{ type: 'paragraph', children: [{ text: 'hi' }] }]);

  const onChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);
  }, [value]);

  return (
    <div>
      <TiEditor
        factory={factory}
        onChange={onChange}
        uploadFile={uploadFile}
        value={value}
      />
    </div>
  );
}

export default App;
