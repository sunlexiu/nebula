import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import '../css/SqlEditor.css';

export default function SqlEditor({ query, setQuery }) {
  return (
    <div className="sql-editor">
      <CodeMirror
        value={query}
        onChange={(value) => setQuery(value)}
        extensions={[sql()]} // 启用 SQL 语法高亮
        height="100%" // 填充整个容器
        theme="light" // 使用 light 主题
        placeholder="Write your SQL here..."
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          tabSize: 2,
          bracketMatching: true,
        }}
        className="codemirror-custom"
        style={{ fontSize: '16px', fontFamily: "'Fira Code', 'SF Mono', Monaco, Consolas, monospace" , fontWeight: 590 }} // 调整字体和大小
      />
    </div>
  );
}