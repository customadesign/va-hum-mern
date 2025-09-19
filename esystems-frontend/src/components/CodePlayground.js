import React, { useState, useEffect } from 'react';
import {
  CodeBracketIcon,
  PlayIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const CodePlayground = ({ initialCode, language = 'javascript', readOnly = false, onCodeChange }) => {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('14px');

  // Language templates
  const templates = {
    javascript: `// JavaScript Playground
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
    html: `<!DOCTYPE html>
<html>
<head>
  <title>HTML Playground</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    .greeting {
      color: #333;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <h1 class="greeting">Hello, World!</h1>
  <p>Welcome to the HTML playground.</p>
</body>
</html>`,
    css: `/* CSS Playground */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}`,
    react: `// React Component
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    } else if (templates[language]) {
      setCode(templates[language]);
    }
  }, [initialCode, language]);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('');
    
    // Simulate code execution
    setTimeout(() => {
      try {
        if (language === 'javascript') {
          // Create a custom console to capture output
          const customConsole = {
            log: (...args) => {
              setOutput(prev => prev + args.join(' ') + '\n');
            },
            error: (...args) => {
              setOutput(prev => prev + 'Error: ' + args.join(' ') + '\n');
            }
          };
          
          // Simple JavaScript evaluation (in production, use a sandboxed environment)
          const func = new Function('console', code);
          func(customConsole);
          
          if (output === '') {
            setOutput('Code executed successfully!\n');
          }
        } else if (language === 'html') {
          setOutput('HTML Preview rendered in iframe below');
        } else if (language === 'css') {
          setOutput('CSS styles applied to preview');
        } else {
          setOutput(`Running ${language} code...\nOutput will appear here.`);
        }
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 1000);
  };

  const handleReset = () => {
    setCode(templates[language] || '');
    setOutput('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  const getLanguageColor = () => {
    const colors = {
      javascript: 'text-yellow-500',
      html: 'text-orange-500',
      css: 'text-blue-500',
      react: 'text-cyan-500',
      python: 'text-green-500'
    };
    return colors[language] || 'text-gray-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <CodeBracketIcon className={`h-5 w-5 ${getLanguageColor()}`} />
          <span className="text-sm font-medium text-gray-300 uppercase">{language}</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Font Size Control */}
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-gray-500"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
          </select>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Toggle theme"
          >
            {theme === 'dark' ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Copy code"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Reset code"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>

          {/* Run Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning || readOnly}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
              isRunning || readOnly
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <PlayIcon className="h-4 w-4" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 text-gray-500 text-right pr-2 pt-4 select-none">
          {code.split('\n').map((_, i) => (
            <div key={i} style={{ fontSize, lineHeight: '1.5' }}>
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={handleCodeChange}
          readOnly={readOnly}
          className={`w-full pl-14 pr-4 py-4 font-mono focus:outline-none resize-none ${
            theme === 'dark'
              ? 'bg-gray-900 text-gray-100'
              : 'bg-white text-gray-900'
          }`}
          style={{
            fontSize,
            lineHeight: '1.5',
            minHeight: '300px',
            tabSize: 2
          }}
          spellCheck="false"
          placeholder={`Enter your ${language} code here...`}
        />
      </div>

      {/* Output Section */}
      {!readOnly && (
        <div className="border-t border-gray-700">
          <div
            className="bg-gray-800 px-4 py-2 flex items-center justify-between cursor-pointer"
            onClick={() => setShowOutput(!showOutput)}
          >
            <span className="text-sm font-medium text-gray-300">Output</span>
            {showOutput ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          {showOutput && (
            <div className="bg-black p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
              {output ? (
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {output}
                </pre>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Output will appear here when you run the code...
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* HTML Preview (if applicable) */}
      {language === 'html' && output && showOutput && (
        <div className="border-t border-gray-700 bg-white">
          <div className="p-4">
            <iframe
              srcDoc={code}
              className="w-full h-64 border border-gray-300 rounded"
              title="HTML Preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodePlayground;