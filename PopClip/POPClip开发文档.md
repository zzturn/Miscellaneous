# PopClip 扩展开发文档

## 重要发现和注意事项

### 1. PATH 环境变量问题

**问题**: PopClip 在沙盒环境中运行，无法访问用户的完整 PATH 环境变量，特别是 NVM 管理的 Node.js 路径。

**解决方案**: 必须在脚本中显式设置 PATH 环境变量：

```bash
# 关键！必须显式设置包含 NVM 路径的 PATH
export PATH="/Users/xin/.nvm/versions/node/v24.11.0/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
```

**为什么重要**:
- PopClip 沙盒环境不加载用户 shell 配置文件（`.bashrc`, `.zshrc` 等）
- NVM 通过修改 PATH 来工作，PopClip 无法自动获取这些路径
- 如果不显式设置，将找不到 `mmdc` 等通过 NVM 安装的工具

### 2. 布尔值配置处理

**问题**: PopClip 的布尔选项值使用 `0` 和 `1` 表示，而不是 `true`/`false`。

**解决方案**:

```yaml
# PopClip 配置
# options:
# - {identifier: debug, label: Debug Mode, type: boolean, defaultValue: false}
```

```bash
# 获取配置选项 - PopClip 布尔值用 0/1 表示
DEBUG_MODE=${POPCLIP_OPTION_DEBUG:-0}

# 判断布尔值
if [ "$DEBUG_MODE" != "0" ]; then
    # 调试模式开启
else
    # 调试模式关闭
fi
```

### 3. 语法兼容性

**避免使用**:
- `heredoc` 语法 (`<<EOF`)
- 复杂的 shell 特性
- 依赖环境变量的命令

**推荐使用**:
- `echo "text" > file` 替代 heredoc
- 基本的 shell 语法
- 完整的命令路径

### 4. 调试策略

由于 PopClip 的 `echo` 输出不会直接显示给用户，推荐使用以下调试方法：

```bash
# 创建调试日志文件
DEBUG_LOG="/tmp/debug.log"

# 调试日志函数
debug_log() {
    if [ "$DEBUG_MODE" != "0" ]; then
        echo "[$(date '+%H:%M:%S')] $1" >> "$DEBUG_LOG"
    fi
}

# 使用方式
debug_log "Processing step 1..."
```

**用户查看调试信息**: `cat /tmp/debug.log`

### 5. 错误处理

```bash
# 统一的错误处理函数
show_error_and_exit() {
    local error_msg="$1"
    debug_log "ERROR: $error_msg"
    if [ "$DEBUG_MODE" != "0" ]; then
        echo "❌ $error_msg"
        echo "Debug log: $DEBUG_LOG"
    else
        echo "Error: $error_msg"
    fi
    exit 1
}
```

## 脚本结构建议

### 推荐的脚本结构

```bash
#!/bin/bash
# #popclip
# [PopClip 元数据]

# =============================================================================
# 标题和说明
# =============================================================================

# 关键设置（如 PATH）
export PATH="..."

# =============================================================================
# 配置和变量初始化
# =============================================================================

# 变量定义
DEBUG_MODE=${POPCLIP_OPTION_DEBUG:-0}

# =============================================================================
# 函数定义
# =============================================================================

# 功能函数
debug_log() { ... }
detect_type() { ... }
show_error() { ... }

# =============================================================================
# 主要执行流程
# =============================================================================

# 主要逻辑

# =============================================================================
# 结果处理
# =============================================================================

# 输出和清理
```

## 最佳实践

### 1. 命令路径
- 始终使用完整路径：`/Users/xin/.nvm/versions/node/v24.11.0/bin/mmdc`
- 或在脚本开头设置正确的 PATH

### 2. 调试功能
- 提供调试模式开关
- 使用日志文件记录详细过程
- 为用户提供查看日志的提示

### 3. 错误处理
- 统一的错误处理函数
- 友好的错误信息
- 在调试模式下提供更多细节

### 4. 兼容性
- 避免使用高级 shell 特性
- 使用基本、通用的语法
- 测试不同环境下的兼容性

## 常见问题排查

### 1. 命令找不到
- 检查 PATH 设置
- 使用完整路径
- 验证命令是否真的存在

### 2. 权限问题
- 确保脚本有执行权限
- 检查目标目录的写权限

### 3. 环境变量
- 不要依赖用户环境变量
- 在脚本中显式设置所需变量

### 4. 调试困难
- 使用日志文件
- 提供调试模式开关
- 记录关键步骤和状态

## 示例：最小可工作的 PopClip 扩展

```bash
#!/bin/bash
# #popclip
# name: Test Extension
# icon: iconify:simple-icons:test
# identifier: com.test.extension
# language: shell
# after: show-result

# 关键：设置 PATH
export PATH="/Users/xin/.nvm/versions/node/v24.11.0/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

# 基本功能测试
echo "Text length: ${#POPCLIP_TEXT}"
echo "First 50 chars: ${POPCLIP_TEXT:0:50}"
echo "✅ Test completed"
```

这个文档总结了开发过程中遇到的关键问题和解决方案，可以作为未来 PopClip 扩展开发的参考。