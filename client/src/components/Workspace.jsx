import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import AuthModal from './AuthModal'; // Make sure this path points to where you saved AuthModal.jsx

const DEFAULT_LANG = 'javascript';

export default function Workspace({ problem, layoutSignal }) {
  const [language, setLanguage] = useState(DEFAULT_LANG);
  const [codeCache, setCodeCache] = useState({});
  const [descriptionWidth, setDescriptionWidth] = useState(50);
  
  // --- AUTHENTICATION STATE ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // ----------------------------

  const containerRef = useRef(null);
  const editorRef = useRef(null);

  const languages = useMemo(() => {
    if (!problem || !problem.code_snippets) return [];
    return Object.keys(problem.code_snippets);
  }, [problem]);

  // Check login status when the component loads
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setIsLoggedIn(true);
    }
  }, []);

  // Show popup if they try to click the editor while logged out
  const handleProtectedAction = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    if (!problem?.code_snippets) return;
    const availableLangs = Object.keys(problem.code_snippets);
    const initialLang = availableLangs.includes(language) ? language : availableLangs[0];
    
    setLanguage(initialLang);
    
    const newCache = {};
    availableLangs.forEach(lang => {
      newCache[lang] = problem.code_snippets[lang];
    });
    
    setCodeCache(newCache);
  }, [problem?.slug]); 

  const handleLanguageChange = (e) => {
    if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
    }
    setLanguage(e.target.value);
  };

  const handleCodeChange = (newCode) => {
    setCodeCache(prev => ({
      ...prev,
      [language]: newCode ?? ''
    }));
  };

  const handleInnerDividerMouseDown = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent) => {
      const offsetX = moveEvent.clientX - rect.left;
      let next = (offsetX / rect.width) * 100;
      next = Math.min(75, Math.max(25, next));
      setDescriptionWidth(next);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    setTimeout(() => editor.layout(), 0);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [descriptionWidth, layoutSignal]);

  if (!problem) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a problem from the dashboard to start coding.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-panel sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-semibold">{problem.title}</h2>
          <p className="text-xs text-gray-400">{problem.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">
            Language:
            <select
              value={language}
              onChange={handleLanguageChange}
              className="ml-2 bg-background border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <section
          className="border-r border-gray-800 flex flex-col bg-background"
          style={{ width: `${descriptionWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ReactMarkdown
              className="prose prose-invert max-w-none"
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <pre className="bg-panel rounded p-3 overflow-auto text-xs font-mono">
                      <code {...props}>{String(children).replace(/\n$/, '')}</code>
                    </pre>
                  ) : (
                    <code className="bg-panel rounded px-1 py-0.5 text-xs font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {problem.description || ''}
            </ReactMarkdown>

            {Array.isArray(problem.examples) && problem.examples.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Examples</h3>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="bg-panel rounded border border-gray-700 p-3 text-xs">
                    <div className="font-semibold text-gray-300 mb-2">
                      Example {ex.example_num || idx + 1}
                    </div>
                    <pre className="bg-background rounded p-2 overflow-auto font-mono whitespace-pre-wrap text-gray-200">
                      {ex.example_text}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div
          className="w-1 bg-gray-800 hover:bg-accent cursor-col-resize transition-colors"
          onMouseDown={handleInnerDividerMouseDown}
        />

        {/* --- EDITOR SECTION --- */}
        <section
          className="flex flex-col bg-background relative"
          style={{ width: `${100 - descriptionWidth}%` }}
        >
          <div className="flex-1 overflow-hidden relative">
            
            {/* THE INVISIBLE SHIELD: Triggers popup if clicked while logged out */}
            {!isLoggedIn && (
                <div 
                    className="absolute inset-0 z-20 cursor-pointer bg-transparent"
                    onClick={handleProtectedAction}
                    title="Log in to start coding"
                />
            )}

            <Editor
              height="100%"
              language={language === 'python3' ? 'python' : language}
              theme="vs-dark"
              value={codeCache[language] || ''}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              options={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true 
              }}
            />
          </div>
        </section>
      </div>

      {/* Render the AuthModal on top of everything */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}