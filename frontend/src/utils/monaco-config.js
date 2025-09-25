import * as monaco from 'monaco-editor'

// SQL 语言配置
export const setupSQLLanguage = (monaco) => {
  // 注册 SQL 语言
  monaco.languages.register({ id: 'sql' });

  // SQL 关键字
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'IS', 'NULL',
    'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'ON', 'AS', 'GROUP', 'BY', 'HAVING',
    'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'CREATE', 'TABLE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE'
  ];

  // 数据库模式
  const databaseSchema = {
    tables: ['users', 'orders', 'products'],
    columns: {
      users: ['id', 'name', 'age', 'email', 'created_at'],
      orders: ['id', 'user_id', 'product_id', 'amount', 'status', 'order_date'],
      products: ['id', 'name', 'price', 'category', 'stock']
    }
  };

  // 智能补全
  monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: [' ', '.', ',', '(', '='],

    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = [];

      // 关键字补全
      sqlKeywords.forEach(keyword => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword + ' ',
          range: range,
          detail: 'SQL Keyword'
        });
      });

      // 表名补全
      databaseSchema.tables.forEach(table => {
        suggestions.push({
          label: table,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: table,
          range: range,
          detail: 'Table'
        });
      });

      // 列名补全（基于上下文）
      const lineContent = model.getLineContent(position.lineNumber);
      const words = lineContent.substring(0, position.column - 1).split(/\s+/);
      const lastWord = words[words.length - 1];

      if (databaseSchema.tables.includes(lastWord)) {
        const tableName = lastWord;
        if (databaseSchema.columns[tableName]) {
          databaseSchema.columns[tableName].forEach(column => {
            suggestions.push({
              label: column,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: column,
              range: range,
              detail: `Column in ${tableName}`
            });
          });
        }
      }

      return {
        suggestions: suggestions.slice(0, 15),
        incomplete: false
      };
    }
  });

  // 悬停提示
  monaco.languages.registerHoverProvider('sql', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const wordText = word.word.toUpperCase();

      if (sqlKeywords.includes(wordText)) {
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [{ value: '**SQL Keyword**: ' + wordText }]
        };
      }

      // 表名提示
      const table = databaseSchema.tables.find(t => t === word.word);
      if (table) {
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [{ value: '**Table**: ' + table }]
        };
      }

      return null;
    }
  });
};

// 编辑器选项
export const editorOptions = {
  value: 'SELECT * FROM users WHERE age > 18',
  language: 'sql',
  theme: 'vs-light',
  fontSize: 13,
  fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  lineHeight: 20,
  wordWrap: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  folding: true,
  renderIndentGuides: true,
  cursorBlinking: 'smooth',
  quickSuggestions: true,
  parameterHints: { enabled: true }
};