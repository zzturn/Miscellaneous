# Miscellaneous

repo 主要记录在日常使用软件时，自己所折腾的一些东西

目前已有

```
.
├── Clash
│   └── config.yaml 
├── Karabiner
│   └── capslock.json
├── PopClip
│   ├── OpenaiTranslate.popcliptxt
│   └── SendToTelegram.popcliptxt
└── README.md
```

以下只是部分简单介绍，具体作用可进入相应文件夹内查看 `README` 文件。

## Clash

[config.yaml](https://github.com/zzturn/Miscellaneous/raw/master/Clash/config.yaml) 是个人在用的 clash 配置（未包含 proxies 和 rules）

## Karabiner

[capslock.json](https://github.com/zzturn/Miscellaneous/raw/master/Karabiner/capslock.json) 是基于 [Capslock](https://github.com/Vonng/Capslock) 的一个 fork，基于自己的实际使用体验进行了适当修改。原作文档可见 [CapsLock](https://github.com/Vonng/Capslock/tree/master/docs/zh-cn)

## PopClip

[OpenaiTranslate.popcliptxt](https://github.com/zzturn/Miscellaneous/raw/master/PopClip/OpenaiTranslate.popcliptxt) 是 PopClip 的一个扩展，下载 PopClip 后直接鼠标选中该文件内容点击弹窗最左边选项即可导入。主要作用是调用 OpenAI 的接口对选中文本进行翻译。需要自备 OpenAI API token

[SendToTelegram.popcliptxt](https://github.com/zzturn/Miscellaneous/raw/master/PopClip/SendToTelegram.popcliptxt) 是 PopClip 的一个扩展，直接鼠标选中该文件内容即可导入。主要作用是将选中文字发送至 Telegram bot。需要自备 bot token 和 自己的 user id