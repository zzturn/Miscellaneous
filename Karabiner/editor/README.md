# Karabiner 可视化配置编辑器

一个用于可视化编辑 Karabiner-Elements `complex_modifications` JSON 配置的 Web 工具，专注于 CapsLock Hyper 层配置管理。

## 技术栈

- **React 19** + **TypeScript**
- **Vite** 构建
- **Tailwind CSS v4** (通过 `@tailwindcss/vite` 插件)
- **Zustand** 状态管理
- 无后端，纯前端应用

## 开发

```bash
cd Karabiner/editor
npm install
npm run dev      # http://localhost:5173
npm run build    # 构建到 dist/
```

## 项目结构

```
src/
├── App.tsx                              # 主布局：三栏式（分类导航 + 主视图 + 详情面板）
├── main.tsx                             # 入口
├── index.css                            # Tailwind + 自定义颜色主题
├── types/
│   ├── editor.ts                        # 编辑器核心类型（KeyBinding, BindingCategory, BindingAction 等）
│   └── karabiner.ts                     # Karabiner JSON Schema 类型（Manipulator, Rule, Condition 等）
├── lib/
│   ├── parser.ts                        # JSON → KeyBinding 解析器 + 分类器 + 冲突检测
│   ├── generator.ts                     # KeyBinding → JSON 生成器 + App Toggle 规则生成
│   ├── keyboard-layout.ts               # 87键 TKL 键盘布局定义
│   └── apps.ts                          # macOS 应用数据库（Bundle ID + 名称 + 分类）
├── store/
│   └── editor-store.ts                  # Zustand 全局状态
└── components/
    ├── Keyboard/Keyboard.tsx            # 虚拟键盘视图（键位着色 + 分类高亮）
    ├── Editor/DetailPanel.tsx           # 右侧详情面板（修饰键矩阵 + 绑定卡片列表）
    ├── Matrix/ModifierMatrix.tsx        # 修饰键矩阵（独立组件，当前未被主流程使用）
    ├── AppManager/AppManager.tsx         # 应用管理视图（添加/删除/编辑应用快捷键）
    └── ImportExport/ImportExport.tsx     # 导入导出（文件/粘贴/演示/下载/复制）
```

## 当前功能

### 已实现

1. **导入配置**
   - 文件导入（JSON）
   - 粘贴导入
   - 加载演示配置（`public/demo-capslock.json`）

2. **解析与分类**
   - 自动解析 Karabiner JSON → 语义化 `KeyBinding` 模型
   - 按 rule 描述关键词智能分类（导航/选择/删除/应用/窗口/输入法）
   - 启发式兜底分类（基于按键码和动作类型）
   - 冲突检测（同键位+同修饰键+同层）

3. **键盘视图**
   - 87键 TKL ANSI 键盘布局（6行，含导航区）
   - 按分类着色键帽
   - 点击键位查看所有绑定
   - 分类过滤时灰化无关节键

4. **应用管理**
   - 按 Bundle ID 分组显示应用
   - 应用数据库搜索（~60款常见 macOS 应用）
   - 添加应用快捷键（自动生成 open/hide toggle 规则）
   - 删除应用快捷键

5. **详情面板**
   - 修饰键矩阵（无修饰/⌘/⌥/⌃/⇧ 与动作的对照表）
   - 绑定卡片列表（分类标签 + 动作类型 + 描述）

6. **导出**
   - 导出为 JSON 文件
   - 复制 JSON 到剪贴板
   - 按 category 分组生成 Rules

### 数据模型

核心类型是 `KeyBinding`，每条记录包含：
- `key` / `modifiers` — 触发键
- `category` — 语义分类（navigation/selection/deletion/application/window/input/variable/custom）
- `action` — 动作（app-toggle/key-remap/shortcut/shell-command/variable-set/input-source 等）
- `layer` — 所属层（如 `hyper_on`）
- `conditions` — Karabiner 条件

## 待完善功能

### 高优先级

- [ ] **双向编辑**：当前只能查看和添加，不能修改已有绑定的 key/modifiers/action/description
- [ ] **导出质量**：生成的 JSON 与原始格式有差异（如 generator 用 `shell_command` 而非 `software_function.open_application`），需要与 capslock.json 对齐
- [ ] **iTerm2 兼容规则**：parser 能识别但编辑器无法创建 iTerm2 专用规则（需要 `frontmost_application_if` 条件）
- [ ] **删除确认**：删除绑定无确认提示，容易误删
- [ ] **持久化**：无 localStorage 保存，刷新页面丢失所有编辑

### 中优先级

- [ ] **搜索功能**：store 中有 `searchQuery` 但 UI 未实现搜索框
- [ ] **Matrix 视图**：`ModifierMatrix` 组件已实现但未集成到主流程
- [ ] **拖拽导入**：UI 提示支持拖拽但实际未实现
- [ ] **编辑动作表单**：点击绑定卡片后应弹出编辑器（选择动作类型、设置参数）
- [ ] **条件编辑**：无法编辑 conditions（层变量、应用条件等）
- [ ] **Undo/Redo**：编辑操作无撤销能力
- [ ] **CapsLock 激活规则编辑**：变量设置规则（`set_variable`）被 parser 跳过，无法编辑 Hyper 层定义

### 低优先级

- [ ] **多文件支持**：store 有 `activeFile` 字段但仅支持单个文件
- [ ] **键盘布局切换**：仅 ANSI TKL，可扩展 ISO/60%/40% 布局
- [ ] **实时预览**：修改后实时预览 Karabiner JSON diff
- [ ] **Karabiner API 对接**：通过 `karabiner://` URL scheme 直接导入
- [ ] **导出验证**：导出前用 JSON Schema 验证配置合法性
- [ ] **深色模式**：当前仅支持浅色
- [ ] **应用图标**：应用管理视图显示应用图标

## 已知问题

1. **Generator 与 Parser 不对称**：Parser 能识别 `software_function.open_application`，但 Generator 只输出 `shell_command`，导出再导入会丢失原生 API 调用
2. **App Toggle 拆分为两条规则**：Parser 将一个 toggle 拆为 open 和 hide 两条绑定，编辑器中显示为两条独立记录，用户可能困惑
3. **键盘宽度硬编码**：键盘区域固定 1022px，小屏幕会溢出
4. **分类着色**：同一键有多个分类时，只显示第一个分类的颜色
5. **BindingCard 分类标签样式**：使用 `cat.bgColor` / `cat.color` 但 `CategoryInfo` 中未定义这两个属性

## 设计决策记录

- **为什么用 Zustand 而非 Redux**：项目规模较小，Zustand 更轻量
- **为什么 Parser 跳过变量激活规则**：Hyper 层激活（CapsLock → set hyper_on）是基础设施，不属于"绑定"，编辑器暂不处理
- **为什么分类优先用 rule 描述**：capslock.json 的 rule description 已经是人工分类的（如"Hyper: 基本导航"），直接利用最准确
- **为什么键盘是 TKL 布局**：匹配实际使用的物理键盘，Home/End/PgUp/PgDn 等导航键可以显示是否有绑定
