import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import '../../css/SqlEditor.css';

export default function SqlEditor({ query, setQuery }) {
  return (
    <div className="sql-editor">
      <CodeMirror
        value={query}
        onChange={setQuery}
        extensions={[sql()]}
        height="100%"
        theme="light"
        placeholder="Write your SQL here..."
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          tabSize: 2,
          bracketMatching: true,
        }}
        className="codemirror-custom"
        style={{ fontSize: '14px', fontFamily: "'Fira Code', 'SF Mono', Monaco, Consolas, monospace", fontWeight: 590 }}
      />
    </div>
  );
}

// =========================================