import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useExplorerStore } from '../store/explorer-store';

export default function CodePane() {
  const selectedFile = useExplorerStore((s) => s.selectedFile);
  const selectedLine = useExplorerStore((s) => s.selectedLine);
  const fileContent = useExplorerStore((s) => s.fileContent);
  const fileLoading = useExplorerStore((s) => s.fileLoading);
  const highlightNodeByName = useExplorerStore((s) => s.highlightNodeByName);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const onEditorMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Code -> Graph: when user clicks in the editor, try to identify a function name
    editor.onMouseDown((e) => {
      if (e.target.position) {
        const model = editor.getModel();
        if (!model) return;

        const word = model.getWordAtPosition(e.target.position);
        if (word) {
          highlightNodeByName(word.word);
        }
      }
    });
  };

  // Jump to line when selection changes
  useEffect(() => {
    if (editorRef.current && selectedLine != null) {
      editorRef.current.revealLineInCenter(selectedLine);
      editorRef.current.setPosition({ lineNumber: selectedLine, column: 1 });

      // Highlight the line
      editorRef.current.deltaDecorations(
        [],
        [
          {
            range: {
              startLineNumber: selectedLine,
              startColumn: 1,
              endLineNumber: selectedLine,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: 'bg-explorer-accent-dim/30',
              glyphMarginClassName: 'bg-explorer-accent',
            },
          },
        ],
      );
    }
  }, [selectedLine, fileContent]);

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-explorer-text-dim gap-2">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <span>Select a node in the graph to view source code</span>
      </div>
    );
  }

  if (fileLoading) {
    return (
      <div className="flex items-center justify-center h-full text-explorer-text-dim">
        Loading {selectedFile}...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* File header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-explorer-surface border-b border-explorer-border text-sm">
        <span className="text-explorer-accent font-mono">{selectedFile}</span>
        {selectedLine != null && (
          <span className="text-explorer-text-dim">:{selectedLine}</span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={fileContent || ''}
          onMount={onEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
