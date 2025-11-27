# PopClip

[PopClip](https://www.popclip.app/) appears when you select text in any app, giving you instant access to useful actions.

[OpenaiTranslate.popcliptxt](https://github.com/zzturn/Miscellaneous/raw/master/PopClip/OpenaiTranslate.popcliptxt) 是 PopClip 的一个扩展，下载 PopClip 后直接鼠标选中该文件内容点击弹窗最左边选项即可导入。主要作用是调用 OpenAI 的接口对选中文本进行翻译。需要自备 OpenAI API token

[SendToTelegram.popcliptxt](https://github.com/zzturn/Miscellaneous/raw/master/PopClip/SendToTelegram.popcliptxt) 是 PopClip 的一个扩展，直接鼠标选中该文件内容即可导入。主要作用是将选中文字发送至 Telegram bot。需要自备 bot token 和 自己的 user id

[MermaidPreview.popcliptxt](https://github.com/zzturn/Miscellaneous/raw/master/PopClip/MermaidPreview.popcliptxt) 是 PopClip 的一个扩展，用于渲染 Mermaid 图表并预览。选中 Mermaid 代码（如流程图、序列图、类图等）后即可生成对应的 PNG 图片并在预览应用中打开。需要安装 @mermaid-js/mermaid-cli

**特性**：
- 支持多种 Mermaid 图表类型（流程图、序列图、类图、甘特图等）
- 生成带时间戳的唯一文件名
- 可选的调试模式，便于问题排查
- 文件保存在 `/tmp/mermaid/` 目录中

**安装要求**：
```bash
npm install -g @mermaid-js/mermaid-cli
```

