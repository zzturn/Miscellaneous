// ==UserScript==
// @name         Inoreader AI Summary
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  点击 Inoreader 原生总结按钮，使用 AI 生成文章总结（带打字效果）
// @author       You
// @match        https://www.inoreader.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      api.deepseek.com
// @connect      api.openai.com
// @connect      api.anthropic.com
// @connect      cdn.jsdelivr.net
// @connect      cdnjs.cloudflare.com
// @require      https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ==================== AI 提供商配置 ====================
    const AI_PROVIDERS = {
        deepseek: {
            name: 'DeepSeek',
            baseUrl: 'https://api.deepseek.com',
            endpoint: '/chat/completions',
            model: 'deepseek-chat',
            headers: (apiKey) => ({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }),
            formatRequest: (content, customPrompt) => ({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: customPrompt || '你是一个专业的文章分析助手。请对给定的文章内容进行结构化总结，包括：1. 核心观点（3-5点）2. 关键信息 3. 可行性建议（如果适用）4. 总结。请使用简洁清晰的语言。'
                    },
                    {
                        role: 'user',
                        content: `请总结分析以下文章：\n\n${content}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            }),
            extractResponse: (response) => response.choices[0]?.message?.content || ''
        },
        openai: {
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com',
            endpoint: '/v1/chat/completions',
            model: 'gpt-4o-mini',
            headers: (apiKey) => ({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }),
            formatRequest: (content, customPrompt) => ({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: customPrompt || '你是一个专业的文章分析助手。请对给定的文章内容进行结构化总结，包括：1. 核心观点（3-5点）2. 关键信息 3. 可行性建议（如果适用）4. 总结。'
                    },
                    {
                        role: 'user',
                        content: `请总结分析以下文章：\n\n${content}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                stream: false
            }),
            extractResponse: (response) => response.choices[0]?.message?.content || ''
        },
        anthropic: {
            name: 'Claude',
            baseUrl: 'https://api.anthropic.com',
            endpoint: '/v1/messages',
            model: 'claude-3-haiku-20241022',
            headers: (apiKey) => ({
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            }),
            formatRequest: (content, customPrompt) => ({
                model: 'claude-3-haiku-20241022',
                max_tokens: 2000,
                system: customPrompt || '你是一个专业的文章分析助手。请对给定的文章内容进行结构化总结，包括：1. 核心观点（3-5点）2. 关键信息 3. 可行性建议（如果适用）4. 总结。',
                messages: [
                    {
                        role: 'user',
                        content: `请总结分析以下文章：\n\n${content}`
                    }
                ]
            }),
            extractResponse: (response) => response.content[0]?.text || ''
        }
    };

    // ==================== 配置管理 ====================
    const CONFIG = {
        getProvider: () => GM_getValue('ai_provider', 'deepseek'),
        setProvider: (provider) => GM_setValue('ai_provider', provider),
        getApiKey: (provider) => GM_getValue(`api_key_${provider}`, ''),
        setApiKey: (provider, key) => GM_setValue(`api_key_${provider}`, key),
        getCustomPrompt: () => GM_getValue('custom_prompt', ''),
        setCustomPrompt: (prompt) => GM_setValue('custom_prompt', prompt)
    };

    // ==================== 缓存管理 ====================
    const CACHE = {
        // 生成缓存键
        generateKey: (articleId, provider, prompt) => {
            const contentHash = simpleHash(articleId + prompt);
            return `ai_summary_${provider}_${contentHash}`;
        },

        // 获取缓存
        get: (articleId, provider, prompt) => {
            const key = CACHE.generateKey(articleId, provider, prompt);
            const cached = GM_getValue(key, null);
            if (cached) {
                const data = JSON.parse(cached);
                // 检查缓存是否过期（7天）
                if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    return data.content;
                }
                // 过期则删除
                GM_deleteValue(key);
            }
            return null;
        },

        // 设置缓存
        set: (articleId, provider, prompt, content) => {
            const key = CACHE.generateKey(articleId, provider, prompt);
            const data = {
                content: content,
                timestamp: Date.now()
            };
            GM_setValue(key, JSON.stringify(data));
        },

        // 清除当前文章缓存
        clear: (articleId, provider, prompt) => {
            const key = CACHE.generateKey(articleId, provider, prompt);
            GM_deleteValue(key);
        },

        // 清除所有缓存
        clearAll: () => {
            const allValues = GM_listValues ? GM_listValues() : [];
            allValues.forEach(key => {
                if (key.startsWith('ai_summary_')) {
                    GM_deleteValue(key);
                }
            });
        }
    };

    // 简单哈希函数
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // ==================== 样式定义 ====================
    const STYLES = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* 文章内总结样式 */
        .article_summaries_custom {
            margin-bottom: 16px;
        }

        .ai_summary_in_article_custom {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin-bottom: 8px;
        }

        .ai_summary_in_article_custom h6 {
            display: flex;
            align-items: center;
            margin-bottom: 12px !important;
            font-weight: 600;
            color: #2d3748;
        }

        .ai_summary_in_article_custom .summary-icon {
            margin-right: 8px;
            color: #667eea;
        }

        .ai_summary_in_article_custom .summary-actions {
            margin-left: auto;
            display: flex;
            gap: 8px;
        }

        .ai_summary_in_article_custom .summary-actions a {
            color: #718096;
            text-decoration: none;
            cursor: pointer;
            transition: color 0.2s;
        }

        .ai_summary_in_article_custom .summary-actions a:hover {
            color: #667eea;
        }

        .ai_summary_body_custom {
            line-height: 1.8;
            color: #4a5568;
            font-size: 14px;
        }

        .ai_summary_body_custom h1,
        .ai_summary_body_custom h2,
        .ai_summary_body_custom h3 {
            margin-top: 16px;
            margin-bottom: 8px;
            color: #2d3748;
        }

        .ai_summary_body_custom ul,
        .ai_summary_body_custom ol {
            margin: 8px 0;
            padding-left: 20px;
        }

        .ai_summary_body_custom li {
            margin: 4px 0;
        }

        .ai_summary_body_custom li::marker {
            color: #667eea;
        }

        .ai_summary_body_custom code {
            background: #edf2f7;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
        }

        .ai_summary_body_custom pre {
            background: #1a202c;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
        }

        .ai_summary_body_custom pre code {
            background: transparent;
            color: inherit;
            padding: 0;
        }

        .ai_summary_body_custom blockquote {
            border-left: 4px solid #667eea;
            padding-left: 12px;
            margin: 12px 0;
            color: #718096;
            font-style: italic;
        }

        .ai_summary_loading_custom {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #666;
        }

        .ai_summary_loading_custom .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e2e8f0;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        .ai_summary_error_custom {
            background: #fed7d7;
            color: #c53030;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
        }

        .ai_summary_cache_badge {
            display: inline-flex;
            align-items: center;
            background: #c6f6d5;
            color: #276749;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 8px;
        }

        /* 打字效果光标 */
        .typing-cursor {
            display: inline-block;
            width: 2px;
            height: 1em;
            background: #667eea;
            margin-left: 2px;
            animation: blink 1s step-end infinite;
            vertical-align: text-bottom;
        }

        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }

        .ai_summary_streaming {
            min-height: 60px;
        }
    `;

    // ==================== 全局状态 ====================
    let currentArticleId = null;
    let inArticleSummaryEnabled = true; // 是否启用文章内总结功能
    let streamingIntervals = {}; // 存储打字效果的 interval ID

    // ==================== 内容提取 ====================
    function extractArticleContent() {
        // 尝试多种选择器策略
        const selectors = [
            () => document.querySelector('[id^="article_contents_inner_"]'),
            () => document.querySelector('#article_contents'),
            () => document.querySelector('.article_content'),
            () => document.querySelector('.article-body'),
            () => document.querySelector('[data-article-content]')
        ];

        for (const selector of selectors) {
            const element = selector();
            if (element) {
                // 清理内容
                let content = element.innerText || element.textContent;

                // 移除多余的空白
                content = content.replace(/\s+/g, ' ').trim();

                // 限制长度
                if (content.length > 15000) {
                    content = content.substring(0, 15000) + '...';
                }

                return content;
            }
        }

        return null;
    }

    // 获取当前文章 ID
    function getArticleId() {
        // 从 URL 获取文章 ID
        const urlMatch = window.location.pathname.match(/\/article\/([^\/]+)/);
        if (urlMatch) {
            return urlMatch[1];
        }

        // 尝试从页面元素获取
        const articleElement = document.querySelector('[id^="article_contents_inner_"]');
        if (articleElement) {
            const idMatch = articleElement.id.match(/article_contents_inner_(.+)/);
            if (idMatch) {
                return idMatch[1];
            }
        }

        // 使用 URL 作为备用
        return simpleHash(window.location.href);
    }

    // ==================== API 调用 ====================
    function callAIProvider(provider, content, customPrompt) {
        return new Promise((resolve, reject) => {
            const config = AI_PROVIDERS[provider];
            const apiKey = CONFIG.getApiKey(provider);

            if (!apiKey) {
                reject(new Error(`未设置 ${config.name} API Key，请在脚本设置中配置`));
                return;
            }

            const requestData = config.formatRequest(content, customPrompt);

            GM_xmlhttpRequest({
                method: 'POST',
                url: config.baseUrl + config.endpoint,
                headers: config.headers(apiKey),
                data: JSON.stringify(requestData),
                onload: (response) => {
                    try {
                        const data = JSON.parse(response.responseText);

                        if (response.status >= 400) {
                            const errorMsg = data.error?.message || data.message || '请求失败';
                            reject(new Error(`${config.name} API 错误: ${errorMsg}`));
                            return;
                        }

                        const result = config.extractResponse(data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`解析响应失败: ${error.message}`));
                    }
                },
                onerror: (error) => {
                    reject(new Error(`网络请求失败: ${error}`));
                },
                ontimeout: () => {
                    reject(new Error('请求超时'));
                },
                timeout: 60000
            });
        });
    }

    // ==================== Markdown 渲染 ====================
    function renderMarkdown(text) {
        // 检查 marked 库是否加载
        if (typeof marked !== 'undefined') {
            try {
                // 配置 marked 选项
                marked.setOptions({
                    breaks: true,      // 支持 GitHub 风格的换行
                    gfm: true,          // GitHub Flavored Markdown
                    headerIds: true,    // 生成标题 ID
                    mangle: false,      // 不混淆邮箱地址
                    sanitize: false,    // 不清理 HTML（允许自定义）
                    smartLists: true,   // 智能列表
                    smartypants: false  // 不使用智能标点
                });

                return marked.parse(text);
            } catch (error) {
                console.error('Markdown 渲染失败:', error);
                return simpleMarkdownFormat(text);
            }
        } else {
            console.warn('marked 库未加载，使用简单格式化');
            return simpleMarkdownFormat(text);
        }
    }

    // ==================== 简单的 Markdown 格式化（备用）====================
    function simpleMarkdownFormat(text) {
        // 转义 HTML
        let formatted = escapeHtml(text);

        // 代码块处理 (```language\ncode\n```)
        formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // 行内代码处理
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 标题处理
        formatted = formatted.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
        formatted = formatted.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        formatted = formatted.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // 粗体和斜体
        formatted = formatted.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
        formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');

        // 引用块
        formatted = formatted.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

        // 无序列表
        formatted = formatted.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');

        // 有序列表
        formatted = formatted.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

        // 包装列表项
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // 分割线
        formatted = formatted.replace(/^---$/gim, '<hr>');
        formatted = formatted.replace(/^\*\*\*$/gim, '<hr>');

        // 链接
        formatted = formatted.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // 处理段落
        const lines = formatted.split('\n');
        let inParagraph = false;
        let result = '';

        for (let line of lines) {
            // 跳过空行和标签行
            if (line.trim() === '' || line.match(/^<(h|ul|ol|li|pre|blockquote|hr|div)/)) {
                if (inParagraph) {
                    result += '</p>\n';
                    inParagraph = false;
                }
                result += line + '\n';
            } else {
                if (!inParagraph) {
                    result += '<p>';
                    inParagraph = true;
                } else {
                    result += '<br>';
                }
                result += line.trim();
            }
        }

        if (inParagraph) {
            result += '</p>\n';
        }

        return result;
    }

    // ==================== 原生总结按钮监听 ====================
    function setupNativeSummaryButtonListener() {
        // 使用事件委托监听动态生成的按钮
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.article_footer_buttons_summarize');
            if (target && inArticleSummaryEnabled) {
                const clickStartTime = performance.now();
                console.log(`%c[AI总结] 按钮点击开始`, 'color: #667eea; font-weight: bold');
                console.log(`[AI总结] 目标元素:`, target);

                // 阻止所有事件传播和默认行为
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // 获取文章 ID - 优先从按钮 ID 提取，其次从 URL/页面提取
                const buttonId = target.id; // 例如: summarize_button_48361064204
                let articleId = null;

                if (buttonId) {
                    const articleIdMatch = buttonId.match(/summarize_button_(\d+)/);
                    if (articleIdMatch) {
                        articleId = articleIdMatch[1];
                        console.log(`[AI总结] 从按钮 ID 提取文章 ID: ${articleId}`);
                    }
                }

                // 如果没有从按钮获取到，尝试其他方式
                if (!articleId) {
                    articleId = getArticleId();
                    console.log(`[AI总结] 从页面提取文章 ID: ${articleId}`);
                }

                // 处理总结显示
                handleInArticleSummary(articleId, target, clickStartTime);
            }
        }, true); // 使用捕获阶段确保在 Inoreader 的处理器之前执行
    }

    // 处理文章内总结
    function handleInArticleSummary(articleId, buttonElement, clickStartTime) {
        const timings = {
            clickStart: clickStartTime,
            containerCheck: 0,
            containerCreate: 0,
            contentExtract: 0,
            cacheCheck: 0,
            apiCallStart: 0,
            apiCallEnd: 0,
            renderStart: 0,
            renderEnd: 0
        };

        // 查找或创建总结容器
        let summariesContainer = document.getElementById(`article_summaries_${articleId}`);
        timings.containerCheck = performance.now();

        if (!summariesContainer) {
            summariesContainer = createInArticleSummaryContainer(articleId, buttonElement);
            timings.containerCreate = performance.now();
            console.log(`[AI总结] 创建容器耗时: ${(timings.containerCreate - timings.containerCheck).toFixed(1)}ms`);
        }

        // 如果容器创建失败，直接返回
        if (!summariesContainer) {
            console.error('[AI总结] 容器创建失败');
            return;
        }

        // 切换显示/隐藏（仅在已有内容时切换）
        const existingSummary = summariesContainer.querySelector('.ai_summary_body_custom');
        const hasContent = existingSummary && existingSummary.textContent.trim();

        if (summariesContainer.style.display === 'block' && hasContent) {
            summariesContainer.style.display = 'none';
            console.log(`[AI总结] 隐藏总结面板（总耗时: ${(performance.now() - clickStartTime).toFixed(1)}ms）`);
            return;
        }

        summariesContainer.style.display = 'block';

        // 如果已有内容，直接显示
        if (hasContent) {
            console.log(`[AI总结] 已有内容，直接显示（总耗时: ${(performance.now() - clickStartTime).toFixed(1)}ms）`);
            return;
        }

        // 提取文章内容
        const extractStart = performance.now();
        const articleContent = extractArticleContent();
        timings.contentExtract = performance.now();
        console.log(`[AI总结] 内容提取耗时: ${(timings.contentExtract - extractStart).toFixed(1)}ms, 内容长度: ${articleContent?.length || 0}`);

        if (!articleContent || articleContent.length < 50) {
            showInArticleError(articleId, '无法提取文章内容，请确保页面已完全加载');
            return;
        }

        const provider = CONFIG.getProvider();
        const customPrompt = CONFIG.getCustomPrompt();

        // 检查缓存
        const cacheCheckStart = performance.now();
        const cached = CACHE.get(articleId, provider, customPrompt);
        timings.cacheCheck = performance.now();
        console.log(`[AI总结] 缓存检查耗时: ${(timings.cacheCheck - cacheCheckStart).toFixed(1)}ms, 命中: ${!!cached}`);

        if (cached) {
            console.log(`[AI总结] 使用缓存内容`);
            const renderStart = performance.now();
            displayInArticleSummary(articleId, cached, true);
            console.log(`[AI总结] 缓存渲染耗时: ${(performance.now() - renderStart).toFixed(1)}ms`);
            console.log(`%c[AI总结] 总耗时（缓存）: ${(performance.now() - clickStartTime).toFixed(1)}ms`, 'color: #48bb78; font-weight: bold');
            return;
        }

        // 显示加载状态
        showInArticleLoading(articleId);

        // 调用 AI API
        timings.apiCallStart = performance.now();
        console.log(`%c[AI总结] 开始调用 API...`, 'color: #ed8936; font-weight: bold');

        callAIProvider(provider, articleContent, customPrompt)
            .then(result => {
                timings.apiCallEnd = performance.now();
                const apiDuration = timings.apiCallEnd - timings.apiCallStart;
                console.log(`%c[AI总结] API 调用耗时: ${apiDuration.toFixed(0)}ms (${(apiDuration/1000).toFixed(2)}s)`, 'color: #667eea; font-weight: bold');

                CACHE.set(articleId, provider, customPrompt, result);

                timings.renderStart = performance.now();
                displayInArticleSummary(articleId, result, false, timings);
            })
            .catch(error => {
                timings.apiCallEnd = performance.now();
                console.error(`[AI总结] API 调用失败 (耗时: ${(timings.apiCallEnd - timings.apiCallStart).toFixed(0)}ms):`, error);
                showInArticleError(articleId, error.message);
            });
    }

    // 创建文章内总结容器
    function createInArticleSummaryContainer(articleId, buttonElement) {
        // 查找 article_content 容器
        const articleContent = document.querySelector('.article_content');
        if (!articleContent) {
            console.error('未找到 article_content 容器');
            return null;
        }

        // 创建总结容器
        const container = document.createElement('div');
        container.className = 'article_summaries_custom';
        container.id = `article_summaries_${articleId}`;
        container.dir = 'ltr';
        container.style.display = 'none';

        // 在 article_content 之前插入
        articleContent.parentNode.insertBefore(container, articleContent);

        console.log('创建总结容器成功', container);
        return container;
    }

    // 显示加载状态
    function showInArticleLoading(articleId) {
        const container = document.getElementById(`article_summaries_${articleId}`);
        if (!container) return;

        container.innerHTML = `
            <div class="ai_summary_in_article_custom">
                <div class="ai_summary_loading_custom">
                    <div class="spinner"></div>
                    <span>正在生成 AI 总结...</span>
                </div>
            </div>
        `;
    }

    // 显示总结内容（带打字效果）
    function displayInArticleSummary(articleId, content, fromCache, timings = null) {
        const container = document.getElementById(`article_summaries_${articleId}`);
        if (!container) return;

        const renderStart = performance.now();
        const cacheBadge = fromCache ? '<span class="ai_summary_cache_badge">来自缓存</span>' : '';

        container.innerHTML = `
            <div class="ai_summary_in_article_custom">
                <h6>
                    <span class="summary-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </span>
                    <span>AI 总结</span>
                    ${cacheBadge}
                    <div class="summary-actions">
                        <a href="javascript:void(0);" title="复制内容" data-action="copy" data-id="${articleId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </a>
                        <a href="javascript:void(0);" title="重新分析" data-action="refresh" data-id="${articleId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </a>
                        <a href="javascript:void(0);" title="关闭" data-action="close" data-id="${articleId}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </a>
                    </div>
                </h6>
                <div class="ai_summary_body_custom ai_summary_streaming" id="summary_body_${articleId}"></div>
            </div>
        `;

        // 保存原始 Markdown 内容用于复制
        container.dataset.originalMarkdown = content;

        // 绑定操作按钮事件
        setupInArticleSummaryActions(container, articleId);

        // 如果来自缓存，直接显示；否则使用打字效果
        const bodyElement = document.getElementById(`summary_body_${articleId}`);
        if (fromCache) {
            bodyElement.innerHTML = renderMarkdown(content);
            console.log(`%c[AI总结] 总耗时（缓存渲染）: ${(performance.now() - renderStart).toFixed(1)}ms`, 'color: #48bb78; font-weight: bold');
        } else {
            typeWriterEffect(bodyElement, content, articleId).then(() => {
                const renderEnd = performance.now();
                console.log(`[AI总结] 打字效果耗时: ${(renderEnd - renderStart).toFixed(0)}ms`);

                if (timings) {
                    const totalDuration = renderEnd - timings.clickStart;
                    console.log(`%c[AI总结] ========== 性能统计 ==========`, 'color: #667eea; font-weight: bold');
                    console.log(`  - 容器检查: ${(timings.containerCheck - timings.clickStart).toFixed(1)}ms`);
                    if (timings.containerCreate) {
                        console.log(`  - 容器创建: ${(timings.containerCreate - timings.containerCheck).toFixed(1)}ms`);
                    }
                    console.log(`  - 内容提取: ${(timings.contentExtract - (timings.containerCreate || timings.containerCheck)).toFixed(1)}ms`);
                    console.log(`  - 缓存检查: ${(timings.cacheCheck - timings.contentExtract).toFixed(1)}ms`);
                    console.log(`  - API调用: ${((timings.apiCallEnd - timings.apiCallStart)/1000).toFixed(2)}s`);
                    console.log(`  - 结果渲染: ${(renderEnd - timings.apiCallEnd).toFixed(0)}ms (含打字效果)`);
                    console.log(`%c[AI总结] 总耗时: ${(totalDuration/1000).toFixed(2)}s (${totalDuration.toFixed(0)}ms)`, 'color: #48bb78; font-weight: bold');
                }
            });
        }
    }

    // 显示错误信息
    function showInArticleError(articleId, message) {
        const container = document.getElementById(`article_summaries_${articleId}`);
        if (!container) return;

        container.innerHTML = `
            <div class="ai_summary_in_article_custom">
                <div class="ai_summary_error_custom">${escapeHtml(message)}</div>
            </div>
        `;
    }

    // 设置文章内总结的操作按钮事件
    function setupInArticleSummaryActions(container, articleId) {
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                switch (action) {
                    case 'copy':
                        copyInArticleSummary(container);
                        break;
                    case 'refresh':
                        refreshInArticleSummary(id);
                        break;
                    case 'close':
                        container.style.display = 'none';
                        break;
                }
            });
        });
    }

    // 复制文章内总结
    function copyInArticleSummary(container) {
        const markdownContent = container.dataset.originalMarkdown || container.textContent;
        navigator.clipboard.writeText(markdownContent).then(() => {
            // 显示复制成功提示
            const copyBtn = container.querySelector('[data-action="copy"]');
            if (copyBtn) {
                const originalTitle = copyBtn.title;
                copyBtn.title = '已复制!';
                setTimeout(() => {
                    copyBtn.title = originalTitle;
                }, 2000);
            }
        }).catch(err => {
            console.error('复制失败:', err);
        });
    }

    // 重新分析文章
    function refreshInArticleSummary(articleId) {
        const provider = CONFIG.getProvider();
        const customPrompt = CONFIG.getCustomPrompt();

        // 清除缓存
        CACHE.clear(articleId, provider, customPrompt);

        // 重新加载
        const buttonElement = document.getElementById(`summarize_button_${articleId}`);
        if (buttonElement) {
            handleInArticleSummary(articleId, buttonElement);
        }
    }

    // ==================== 打字效果 ====================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function typeWriterEffect(element, content, articleId, speed = 15) {
        return new Promise((resolve) => {
            // 清除之前的打字效果
            if (streamingIntervals[articleId]) {
                clearInterval(streamingIntervals[articleId]);
                delete streamingIntervals[articleId];
            }

            let index = 0;
            element.innerHTML = '';

            // 添加光标元素
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';

            const typeInterval = setInterval(() => {
                if (index < content.length) {
                    // 每次添加 1-3 个字符，模拟真实打字
                    const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, content.length - index);
                    const chunk = content.substring(index, index + charsToAdd);

                    // 临时显示纯文本（带换行）
                    element.innerHTML = escapeHtml(content.substring(0, index + charsToAdd)).replace(/\n/g, '<br>');
                    element.appendChild(cursor);

                    index += charsToAdd;

                    // 自动滚动
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    clearInterval(typeInterval);
                    delete streamingIntervals[articleId];

                    // 完成后渲染完整的 Markdown
                    element.innerHTML = renderMarkdown(content);
                    resolve();
                }
            }, speed);

            streamingIntervals[articleId] = typeInterval;
        });
    }

    // ==================== 添加样式 ====================
    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = STYLES;
        document.head.appendChild(styleElement);
    }

    // ==================== 设置菜单 ====================
    function setupMenuCommands() {
        GM_registerMenuCommand('⚙️ 设置 API Key', () => {
            const provider = prompt(
                `选择 AI 提供商:\n${Object.keys(AI_PROVIDERS).map((k, i) => `${i + 1}. ${AI_PROVIDERS[k].name}`).join('\n')}\n\n输入序号:`,
                '1'
            );

            if (!provider) return;

            const providerKeys = Object.keys(AI_PROVIDERS);
            const index = parseInt(provider) - 1;

            if (index >= 0 && index < providerKeys.length) {
                const selectedProvider = providerKeys[index];
                const currentKey = CONFIG.getApiKey(selectedProvider);
                const newKey = prompt(`输入 ${AI_PROVIDERS[selectedProvider].name} API Key:`, currentKey);

                if (newKey !== null) {
                    CONFIG.setApiKey(selectedProvider, newKey);
                    CONFIG.setProvider(selectedProvider);
                    alert(`已设置 ${AI_PROVIDERS[selectedProvider].name} API Key`);
                }
            }
        });

        GM_registerMenuCommand('🔄 切换 AI 提供商', () => {
            const currentProvider = CONFIG.getProvider();
            const providers = Object.keys(AI_PROVIDERS).map(k => `${k}: ${AI_PROVIDERS[k].name}`).join('\n');
            alert(`当前提供商: ${AI_PROVIDERS[currentProvider].name}\n\n可用提供商:\n${providers}`);
        });

        GM_registerMenuCommand('📝 自定义提示词', () => {
            const currentPrompt = CONFIG.getCustomPrompt();
            const newPrompt = prompt('输入自定义提示词（留空使用默认）:', currentPrompt);

            if (newPrompt !== null) {
                CONFIG.setCustomPrompt(newPrompt);
                alert('已保存自定义提示词');
            }
        });

        GM_registerMenuCommand('🗑️ 清除所有缓存', () => {
            if (confirm('确定要清除所有文章的 AI 总结缓存吗？')) {
                CACHE.clearAll();
                alert('已清除所有缓存');
            }
        });
    }

    // ==================== 初始化 ====================
    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading' || !document.body) {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        try {
            // 检查 marked 库是否加载
            if (typeof marked !== 'undefined') {
                console.log('✓ marked.js 已加载，版本:', marked.version || '未知');
            } else {
                console.warn('✗ marked.js 未加载，将使用简单的 Markdown 格式化');
            }

            injectStyles();
            setupMenuCommands();
            setupNativeSummaryButtonListener();

            console.log('Inoreader AI Summary 已加载');
            console.log('当前 AI 提供商:', AI_PROVIDERS[CONFIG.getProvider()].name);
        } catch (error) {
            console.error('Inoreader AI Summary 初始化失败:', error);
        }
    }

    init();
})();
