<template>
  <div class="monaco-editor-container" :style="{ height: height }">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup>
import { debounce } from 'lodash-es'
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// ============ 简单方案：禁用 Worker ============
// 配置 Monaco Editor 使用本地 worker
if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
      // 使用相对路径指向 node_modules 中的 worker 文件
      const base = '/node_modules/monaco-editor/esm/vs'

      if (label === 'json') {
        return `${base}/language/json/json.worker.js`
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return `${base}/language/css/css.worker.js`
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return `${base}/language/html/html.worker.js`
      }
      if (label === 'typescript' || label === 'javascript') {
        return `${base}/language/typescript/ts.worker.js`
      }
      // 默认返回编辑器 worker
      return `${base}/editor/editor.worker.js`
    },
  }
}
// ============ 配置结束 ============

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'json',
  },
  height: {
    type: String,
    default: '300px',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  theme: {
    type: String,
    default: 'vs-dark',
  },
  options: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'save'])

const editorContainer = ref(null)
let editor = null

// 默认配置
const defaultOptions = {
  automaticLayout: true,
  fontSize: 13,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  formatOnType: true,
  renderWhitespace: 'boundary',
  renderLineHighlight: 'all',
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
}

// 语言配置
const languageConfigs = {
  java: {
    extensions: ['.java'],
    keywords: [
      'abstract',
      'assert',
      'boolean',
      'break',
      'byte',
      'case',
      'catch',
      'char',
      'class',
      'const',
      'continue',
      'default',
      'do',
      'double',
      'else',
      'enum',
      'extends',
      'final',
      'finally',
      'float',
      'for',
      'goto',
      'if',
      'implements',
      'import',
      'instanceof',
      'int',
      'interface',
      'long',
      'native',
      'new',
      'package',
      'private',
      'protected',
      'public',
      'return',
      'short',
      'static',
      'strictfp',
      'super',
      'switch',
      'synchronized',
      'this',
      'throw',
      'throws',
      'transient',
      'try',
      'void',
      'volatile',
      'while',
    ],
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
    ],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    tokenizer: {
      root: [
        // 注释
        [/(\/\/.*$)/, 'comment'],
        [/(\/\*.*\*\/)/, 'comment'],
        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        // 数字
        [/\b\d+\.?\d*\b/, 'number'],
        // 关键字
        [
          /\b(?:class|interface|public|private|protected|static|final|abstract|extends|implements|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|new|this|super|void|boolean|byte|char|short|int|long|float|double)\b/,
          'keyword',
        ],
        // 类型
        [
          /\b(?:String|List|Map|Set|ArrayList|HashMap|HashSet|Object|Integer|Long|Double|Float|Boolean|Date|Calendar)\b/,
          'type',
        ],
        // 注解
        [/(@[a-zA-Z]+)/, 'annotation'],
        // 方法调用
        [/([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/, 'function'],
        // 标识符
        [/([a-zA-Z_][a-zA-Z0-9_]*)/, 'identifier'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  },
  python: {
    extensions: ['.py'],
    keywords: [
      'and',
      'as',
      'assert',
      'async',
      'await',
      'break',
      'class',
      'continue',
      'def',
      'del',
      'elif',
      'else',
      'except',
      'finally',
      'for',
      'from',
      'global',
      'if',
      'import',
      'in',
      'is',
      'lambda',
      'nonlocal',
      'not',
      'or',
      'pass',
      'raise',
      'return',
      'try',
      'while',
      'with',
      'yield',
      'True',
      'False',
      'None',
    ],
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
    ],
    tokenizer: {
      root: [
        // 注释
        [/(#.*$)/, 'comment'],
        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, 'string', '@string2'],
        // 数字
        [/\b\d+\.?\d*\b/, 'number'],
        // 关键字
        [
          /\b(?:def|class|if|elif|else|for|while|return|try|except|finally|import|from|as|with|lambda|assert|yield|break|continue|pass|raise|global|nonlocal)\b/,
          'keyword',
        ],
        // 内置函数
        [
          /\b(?:print|len|range|str|int|float|list|dict|set|tuple|sorted|map|filter|zip|enumerate|sum|min|max|abs|round|type|isinstance|hasattr|getattr|setattr|delattr)\b/,
          'function',
        ],
        // 标识符
        [/([a-zA-Z_][a-zA-Z0-9_]*)/, 'identifier'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      string2: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  },
  javascript: {
    extensions: ['.js', '.jsx', '.mjs'],
    keywords: [
      'abstract',
      'as',
      'async',
      'await',
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'enum',
      'export',
      'extends',
      'false',
      'finally',
      'for',
      'from',
      'function',
      'get',
      'if',
      'implements',
      'import',
      'in',
      'instanceof',
      'interface',
      'let',
      'new',
      'null',
      'package',
      'private',
      'protected',
      'public',
      'return',
      'set',
      'static',
      'super',
      'switch',
      'symbol',
      'this',
      'throw',
      'true',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'yield',
    ],
    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<=',
      '>>=',
      '>>>=',
    ],
    tokenizer: {
      root: [
        // 注释
        [/(\/\/.*$)/, 'comment'],
        [/(\/\*.*\*\/)/, 'comment'],
        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, 'string', '@string2'],
        // 正则表达式
        [/\/(\\[^\\\n]|[^\/\n\\])*\//, 'regexp'],
        // 数字
        [/\b\d+\.?\d*\b/, 'number'],
        // 关键字
        [
          /\b(?:function|var|let|const|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|class|extends|super|import|export|default|async|await)\b/,
          'keyword',
        ],
        // 内置对象
        [
          /\b(?:console|window|document|Array|Object|String|Number|Boolean|Function|Date|RegExp|Error|Promise|Map|Set|Symbol)\b/,
          'type',
        ],
        // 标识符
        [/([a-zA-Z_$][a-zA-Z0-9_$]*)/, 'identifier'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      string2: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  },
  json: {
    extensions: ['.json'],
    tokenizer: {
      root: [
        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        // 数字
        [/-?\d+\.?\d*/, 'number'],
        // 布尔值
        [/\b(true|false|null)\b/, 'keyword'],
        // 冒号
        [/:/, 'delimiter'],
        // 逗号
        [/,/, 'delimiter'],
        // 大括号
        [/\{/, 'delimiter', '@object'],
        [/\[/, 'delimiter', '@array'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      object: [
        [/\}/, 'delimiter', '@pop'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/:/, 'delimiter'],
        [/,/, 'delimiter'],
      ],
      array: [
        [/\]/, 'delimiter', '@pop'],
        [/,/, 'delimiter'],
      ],
    },
  },
}

// 配置 Monaco 语言
const configureLanguages = () => {
  Object.keys(languageConfigs).forEach((lang) => {
    const config = languageConfigs[lang]
    monaco.languages.register({ id: lang })

    monaco.languages.setMonarchTokensProvider(lang, {
      keywords: config.keywords,
      operators: config.operators,
      tokenizer: config.tokenizer,
    })

    monaco.languages.setLanguageConfiguration(lang, {
      comments: {
        lineComment: lang === 'python' ? '#' : '//',
        blockComment: lang === 'python' ? ['"""', '"""'] : ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      folding: {
        markers: {
          start: new RegExp('^\\s*//\\s*#region'),
          end: new RegExp('^\\s*//\\s*#endregion'),
        },
      },
    })
  })
}

// 创建编辑器
const createEditor = () => {
  if (!editorContainer.value) return

  const options = {
    ...defaultOptions,
    ...props.options,
    language: props.language,
    readOnly: props.readOnly,
    theme: props.theme,
    value: props.modelValue,
  }

  editor = monaco.editor.create(editorContainer.value, options)

  // 监听内容变化
  editor.onDidChangeModelContent(
    debounce(() => {
      const value = editor.getValue()
      emit('update:modelValue', value)
      emit('change', value)
    }, 300),
  )

  // 监听保存快捷键 (Cmd+S / Ctrl+S)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const value = editor.getValue()
    emit('save', value)
  })

  // 格式化代码
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
    editor.getAction('editor.action.formatDocument').run()
  })

  // 自动调整大小
  window.addEventListener('resize', () => {
    if (editor) {
      editor.layout()
    }
  })
}

// 格式化代码
const format = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument').run()
  }
}

// 获取选中的内容
const getSelection = () => {
  if (editor) {
    const selection = editor.getSelection()
    return editor.getModel().getValueInRange(selection)
  }
  return ''
}

// 插入文本
const insertText = (text) => {
  if (editor) {
    const selection = editor.getSelection()
    editor.executeEdits('', [
      {
        range: selection,
        text: text,
      },
    ])
  }
}

// 设置光标位置
const setCursorPosition = (line, column) => {
  if (editor) {
    editor.setPosition({ lineNumber: line, column: column })
    editor.revealLineInCenter(line)
    editor.focus()
  }
}

// 获取光标位置
const getCursorPosition = () => {
  if (editor) {
    const position = editor.getPosition()
    return { line: position.lineNumber, column: position.column }
  }
  return null
}

// 监听语言变化
watch(
  () => props.language,
  (newLang) => {
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel(), newLang)
    }
  },
)

// 监听值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue)
    }
  },
)

// 监听只读变化
watch(
  () => props.readOnly,
  (readOnly) => {
    if (editor) {
      editor.updateOptions({ readOnly })
    }
  },
)

// 监听主题变化
watch(
  () => props.theme,
  (theme) => {
    if (editor) {
      monaco.editor.setTheme(theme)
    }
  },
)

onMounted(() => {
  configureLanguages()
  createEditor()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})

// 暴露方法给父组件
defineExpose({
  format,
  getSelection,
  insertText,
  setCursorPosition,
  getCursorPosition,
  focus: () => editor?.focus(),
  getValue: () => editor?.getValue(),
  setValue: (value) => editor?.setValue(value),
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  background: #1e1e1e;
}

.editor-container {
  width: 100%;
  height: 100%;
}

/* 针对不同语言的主题微调 */
:deep(.monaco-editor .line-numbers) {
  color: #858585;
}

:deep(.monaco-editor .view-line) {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

:deep(.monaco-editor .mtk1) {
  /* 关键字颜色 */
  color: #569cd6;
}

:deep(.monaco-editor .mtk4) {
  /* 字符串颜色 */
  color: #ce9178;
}

:deep(.monaco-editor .mtk5) {
  /* 注释颜色 */
  color: #6a9955;
  font-style: italic;
}

:deep(.monaco-editor .mtk7) {
  /* 数字颜色 */
  color: #b5cea8;
}

:deep(.monaco-editor .mtk8) {
  /* 类型颜色 */
  color: #4ec9b0;
}
</style>
