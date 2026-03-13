// ==UserScript==
// @name         GitLab MR Helper
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  在 GitLab MR 页面添加快捷按钮：一键设置 MR 标题和合并后删除分支
// @author       You
// @match        http://192.168.9.111:60200/*/*/merge_requests/*
// @match        https://*/-/merge_requests/*
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 样式定义 ====================
    const STYLES = `
        .gl-button.js-mr-helper-btn {
            margin-left: 8px;
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid #dbdbdb;
            background-color: #fafafa;
            color: #333;
            transition: all 0.2s;
        }

        .gl-button.js-mr-helper-btn:hover {
            background-color: #f0f0f0;
            border-color: #ccc;
        }

        .gl-button.js-mr-helper-btn.primary {
            background-color: #1f75cb;
            color: white;
            border-color: #1f75cb;
        }

        .gl-button.js-mr-helper-btn.primary:hover {
            background-color: #1068bf;
            border-color: #1068bf;
        }

        .mr-helper-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .mr-helper-toast.success {
            background-color: #1aaa55;
        }

        .mr-helper-toast.error {
            background-color: #db3b21;
        }

        .mr-helper-toast.info {
            background-color: #1f75cb;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .mr-helper-loading::after {
            content: '';
            width: 12px;
            height: 12px;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-left: 6px;
            display: inline-block;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    // ==================== 工具函数 ====================

    function showToast(message, type = 'info', duration = 3000) {
        const existingToast = document.querySelector('.mr-helper-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `mr-helper-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), duration);
    }

    function getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    function getMRInfo() {
        const urlPath = window.location.pathname;
        const match = urlPath.match(/^(\/[^/]+\/[^/]+)\/-\/merge_requests\/(\d+)/);
        if (match) {
            return {
                projectPath: match[1],
                mrId: match[2]
            };
        }
        return null;
    }

    // 通过 API 获取最新 commit message
    async function getLatestCommitMessage() {
        const mrInfo = getMRInfo();
        if (!mrInfo) return null;

        const apiUrl = `${mrInfo.projectPath}/-/merge_requests/${mrInfo.mrId}/commits.json`;

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) return null;

            const data = await response.json();
            if (data.html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.html, 'text/html');
                const commitLink = doc.querySelector('a.commit-row-message, .commit-row-message');
                if (commitLink) return commitLink.textContent.trim();
            }
            return null;
        } catch (e) {
            console.error('[GitLab MR Helper] 获取 commit 失败:', e);
            return null;
        }
    }

    // 通过 API 更新 MR
    async function updateMR(projectPath, mrId, updates) {
        const csrfToken = getCSRFToken();
        const apiUrl = `${projectPath}/-/merge_requests/${mrId}.json`;

        console.log('[GitLab MR Helper] API URL:', apiUrl);
        console.log('[GitLab MR Helper] 更新参数:', updates);

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Accept': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        console.log('[GitLab MR Helper] 响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GitLab MR Helper] 错误响应:', errorText);
            throw new Error(`更新失败: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    // ==================== 功能函数 ====================

    // 设置 MR 标题为最新 commit message
    async function setTitleFromCommit(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="mr-helper-loading">处理中</span>';
        button.disabled = true;

        try {
            const mrInfo = getMRInfo();
            if (!mrInfo) {
                showToast('无法获取 MR 信息', 'error');
                return;
            }

            const commitMessage = await getLatestCommitMessage();
            if (!commitMessage) {
                showToast('无法获取 commit message', 'error');
                return;
            }

            await updateMR(mrInfo.projectPath, mrInfo.mrId, { title: commitMessage });
            showToast(`标题已更新: ${commitMessage}`, 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            showToast(`更新失败: ${e.message}`, 'error');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // 设置合并后删除源分支
    async function setDeleteAfterMerge(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="mr-helper-loading">处理中</span>';
        button.disabled = true;

        try {
            const mrInfo = getMRInfo();
            if (!mrInfo) {
                showToast('无法获取 MR 信息', 'error');
                return;
            }

            console.log('[GitLab MR Helper] 尝试设置删除分支');

            // 使用 Rails 格式的参数名
            const updates = {
                merge_request: {
                    force_remove_source_branch: '1'
                }
            };

            await updateMR(mrInfo.projectPath, mrInfo.mrId, updates);
            showToast('已设置合并后删除源分支', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            console.error('[GitLab MR Helper] 设置失败:', e);
            showToast(`设置失败: ${e.message}`, 'error');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // ==================== UI 创建 ====================

    function createButtons() {
        const containers = [
            document.querySelector('.detail-page-header-actions'),
            document.querySelector('.merge-request-actions'),
            document.querySelector('.js-issuable-header-wrap'),
            document.querySelector('.detail-page-header-content')
        ];

        let container = containers.find(c => c);
        if (!container) return null;

        if (document.querySelector('.js-mr-helper-btn')) return null;

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: inline-flex; gap: 4px; margin-left: 8px;';

        // 按钮1: 设置标题
        const titleBtn = document.createElement('button');
        titleBtn.className = 'gl-button js-mr-helper-btn primary';
        titleBtn.type = 'button';
        titleBtn.innerHTML = '📝 设置标题';
        titleBtn.title = '使用最新 commit message 作为 MR 标题';
        titleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setTitleFromCommit(titleBtn);
        });

        // 按钮2: 删除分支
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'gl-button js-mr-helper-btn';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '🗑️ 合并后删除';
        deleteBtn.title = '设置合并后自动删除源分支';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDeleteAfterMerge(deleteBtn);
        });

        btnGroup.appendChild(titleBtn);
        btnGroup.appendChild(deleteBtn);
        container.appendChild(btnGroup);

        console.log('[GitLab MR Helper] 按钮已添加');
        return btnGroup;
    }

    // ==================== 初始化 ====================

    function init() {
        if (!window.location.pathname.includes('/merge_requests/')) return;
        if (window.location.pathname.includes('/edit')) return;

        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);

        const tryCreate = (retries = 10) => {
            if (retries <= 0) return;
            if (!createButtons()) {
                setTimeout(() => tryCreate(retries - 1), 500);
            }
        };

        if (document.readyState === 'complete') {
            tryCreate();
        } else {
            window.addEventListener('load', () => setTimeout(tryCreate, 500));
        }

        console.log('[GitLab MR Helper] 已加载 v1.3.0');
    }

    init();
})();
