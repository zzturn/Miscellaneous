/**
 * HTML 代码在线即时预览，左侧编辑 HTML 代码，右侧自动更新显示预览画面
 * 
 * 维护记录：
 *   - 2025-05-17 创建基础功能
 *   - 2025-05-18 添加注释
 * 
 * @author: zzturn
 */


export default {
  async fetch(request, env, ctx) {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    
    <head>
        <meta charset="UTF-8">
        <title>HTML 实时预览编辑器</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            html,
            body {
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
    
            body {
                height: 100vh;
                background: linear-gradient(135deg, #232526 0%, #414345 100%);
                color: #f1f1f1;
                font-family: 'Segoe UI', 'PingFang SC', 'Helvetica Neue', Arial, 'Microsoft Yahei', sans-serif;
                width: 100vw;
                overflow: hidden;
            }
    
            .split-container {
                display: flex;
                height: 100vh;
                width: 100vw;
            }
    
            .editor {
                flex-basis: 50%;
                min-width: 100px;
                max-width: calc(100% - 100px - 8px);
                /* 8px为split-bar宽度 */
                height: 100%;
                background: #232931;
            }
    
            .preview {
                flex: 1 1 0;
                height: 100%;
                background: #2c313a;
                min-width: 100px;
            }
    
            .editor label,
            .preview label {
                font-weight: bold;
                color: #8ec6ff;
                margin: 1.2em 0 0.5em 1.2em;
                font-size: 1em;
                letter-spacing: 1px;
                user-select: none;
            }
    
            textarea {
                width: 100%;
                height: 100%;
                font-family: 'Fira Mono', 'Consolas', monospace;
                font-size: 1em;
                border: none;
                padding: 1.2em;
                background: #232931;
                color: #f1f1f1;
                resize: none;
                box-sizing: border-box;
                outline: none;
                flex: 1;
                border-radius: 0;
            }
    
            textarea:focus {
                box-shadow: 0 0 0 2px #8ec6ff33;
            }
    
            iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: #fff;
                border-radius: 0;
                flex: 1;
            }
    
            .split-bar {
                width: 8px;
                background: #8ec6ff;
                cursor: col-resize;
                transition: 0.1s background;
            }
    
            .split-bar:hover,
            .split-bar.active {
                background: #4dabf7;
            }
    
            @media (max-width: 700px) {
    
                .editor label,
                .preview label {
                    margin-left: 0.5em;
                }
    
                textarea {
                    font-size: 0.95em;
                    padding: 0.7em;
                }
            }
        </style>
    </head>
    
    <body>
        <div class="split-container">
            <div class="editor">
                <label for="htmlInput">HTML代码编辑区</label>
                <textarea id="htmlInput" spellcheck="false">&lt;!DOCTYPE html&gt;
    &lt;html lang="zh-CN"&gt;
    &lt;head&gt;
      &lt;meta charset="UTF-8"&gt;
      &lt;title&gt;Hello World&lt;/title&gt;
      &lt;style&gt;
        body { background: #e3f6fd; color: #222; font-family: sans-serif; }
        h1 { color: #2196f3; }
      &lt;/style&gt;
    &lt;/head&gt;
    &lt;body&gt;
      &lt;h1&gt;Hello, World!&lt;/h1&gt;
      &lt;p&gt;你可以在左侧编辑 HTML，右侧将实时预览效果。&lt;/p&gt;
    &lt;/body&gt;
    &lt;/html&gt;</textarea>
            </div>
            <div class="split-bar" id="splitBar"></div>
            <div class="preview">
                <label>实时预览</label>
                <iframe id="previewFrame" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
        </div>
        <script>
            // 实时预览
            const textarea = document.getElementById('htmlInput');
            const iframe = document.getElementById('previewFrame');
            function updatePreview() {
                iframe.srcdoc = textarea.value;
            }
            textarea.addEventListener('input', updatePreview);
            updatePreview();
        </script>
        <script>
            let ghostBar = null;
            let dragMask = null;
            let isDragging = false;
    
            const splitBar = document.getElementById('splitBar');
            const editor = document.querySelector('.editor');
    
            splitBar.addEventListener('mousedown', (e) => {
                isDragging = true;
                // 创建虚拟分割条
                ghostBar = splitBar.cloneNode();
                ghostBar.id = 'ghost-bar';
                ghostBar.style.cssText = \`
                    position: fixed;
                    left: \${e.clientX}px;
                    top: 0;
                    height: 100vh;
                    width: 8px;
                    background: #4dabf7;
                    z-index: 9999;
                    cursor: col-resize;
                \`;
                document.body.appendChild(ghostBar);
    
                // 添加遮罩层
                dragMask = document.createElement('div');
                dragMask.style.position = 'fixed';
                dragMask.style.left = '0';
                dragMask.style.top = '0';
                dragMask.style.width = '100vw';
                dragMask.style.height = '100vh';
                dragMask.style.zIndex = '9998';
                dragMask.style.cursor = 'col-resize';
                dragMask.style.background = 'rgba(0,0,0,0)';
                document.body.appendChild(dragMask);
    
                // 监听window上的mousemove和mouseup
                window.addEventListener('mousemove', onDragMove);
                window.addEventListener('mouseup', onDragEnd);
    
                e.preventDefault();
            });
    
            function onDragMove(e) {
                if (!isDragging || !ghostBar) return;
                ghostBar.style.left = \`\${e.clientX}px\`;
            }
    
            function onDragEnd(e) {
                if (!isDragging) return;
                const containerWidth = document.body.clientWidth;
                const editorMin = 100;
                const previewMin = 100;
                const barWidth = 8;
                const maxEditorWidth = containerWidth - previewMin - barWidth;
                let newWidth = e.clientX;
                newWidth = Math.max(editorMin, Math.min(newWidth, maxEditorWidth));
                editor.style.flexBasis = \`\${newWidth}px\`;
    
                if (ghostBar) {
                    document.body.removeChild(ghostBar);
                    ghostBar = null;
                }
                if (dragMask) {
                    document.body.removeChild(dragMask);
                    dragMask = null;
                }
    
                window.removeEventListener('mousemove', onDragMove);
                window.removeEventListener('mouseup', onDragEnd);
    
                isDragging = false;
            }
    
        </script>
    </body>
    
    </html>
    `;
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=UTF-8' },
    });
  }
}
