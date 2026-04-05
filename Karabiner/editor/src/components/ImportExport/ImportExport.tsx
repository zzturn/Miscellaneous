import { useRef, useState } from 'react';
import type { KarabinerConfig } from '../../types/karabiner';
import type { KeyBinding } from '../../types/editor';
import { generateConfig } from '../../lib/generator';

interface ImportExportProps {
  config: KarabinerConfig | null;
  bindings: KeyBinding[];
  onImport: (config: KarabinerConfig, fileName: string) => void;
}

export function ImportExport({ config, bindings, onImport }: ImportExportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        onImport(json, file.name);
      } catch {
        alert('JSON 解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = async () => {
    try {
      const resp = await fetch('/demo-capslock.json');
      const json = await resp.json();
      onImport(json, 'capslock.json');
    } catch {
      alert('加载演示配置失败');
    }
  };

  const handlePasteImport = () => {
    const jsonStr = prompt('粘贴 Karabiner JSON 配置:');
    if (!jsonStr) return;
    try {
      const json = JSON.parse(jsonStr);
      onImport(json, 'pasted-config.json');
    } catch {
      alert('JSON 解析失败');
    }
  };

  const handleExport = () => {
    if (!config) return;
    const generated = generateConfig(bindings, {
      title: config.title || 'Karabiner Config',
      url: config.url,
      author: config.author,
    });
    const json = JSON.stringify(generated, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karabiner-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    if (!config) return;
    const generated = generateConfig(bindings, {
      title: config.title || 'Karabiner Config',
      url: config.url,
      author: config.author,
    });
    navigator.clipboard.writeText(JSON.stringify(generated, null, 2));
    alert('已复制到剪贴板');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Import */}
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
      >
        <span>📂</span> 导入 JSON
      </button>
      <button
        onClick={handlePasteImport}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
      >
        <span>📋</span> 粘贴导入
      </button>
      <button
        onClick={handleLoadDemo}
        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-1"
      >
        <span>🎮</span> 加载演示
      </button>

      {/* Export */}
      {config && (
        <>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
          >
            <span>💾</span> 导出 JSON
          </button>
          <button
            onClick={handleCopyJSON}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <span>📄</span> 复制 JSON
          </button>
        </>
      )}
    </div>
  );
}
