# 超时机制测试指南

## 测试场景

### 1. 正常命令（应该成功）
```bash
# 测试快速完成的命令
echo "Hello World"
ls -la
pwd
```

### 2. 慢命令（应该在30秒内完成）
```bash
# 测试需要一些时间但能完成的命令
sleep 5
find /usr -name "*.txt" | head -10
```

### 3. 超时命令（应该触发超时）
```bash
# 测试会超时的命令（默认30秒超时）
sleep 40
tail -f /var/log/syslog  # 永不结束的命令
yes | head -n 1000000    # 大量输出的命令
```

### 4. 自定义超时测试
```bash
# 设置更短的超时时间进行测试
export Terminal_Command_Timeout=5000  # 5秒超时
npm run dev
```

## 预期行为

### ✅ 正常命令
- 执行成功，返回正确输出
- 控制台显示：`Command completed in XXXms`

### ✅ 超时命令
- 在30秒后抛出超时错误
- 错误消息：`Command execution timed out after 30000ms. Command: sleep 40`
- 控制台显示：`Command timed out after XXXms: sleep 40`

### ✅ 日志记录
- 每个命令执行都有日志记录
- 包含命令内容、终端ID、执行时间

## 验证步骤

1. **启动服务**
   ```bash
   npm run dev
   ```

2. **在浏览器中打开终端**
   ```
   http://localhost:3000
   ```

3. **通过MCP客户端测试**
   ```bash
   # 使用 MCP 客户端执行超时命令
   npx -y hyper-mcp-terminal
   ```

4. **观察日志输出**
   - 查看控制台日志
   - 检查超时处理是否正确

## 配置选项

| 环境变量 | 默认值 | 说明 |
|---------|-------|------|
| `Terminal_Command_Timeout` | 30000 | 命令超时时间（毫秒） |
| `Terminal_End_CheckCount` | 15 | 结束检测次数 |
| `Terminal_Output_MaxToken` | 10000 | 输出最大长度 |

## 超时机制实现细节

```typescript
const startTime = Date.now();
const maxEndTime = startTime + commandTimeout;

while (Date.now() < maxEndTime) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  if (checkEnd(c.commandOutput)) {
    // 命令正常结束
    break;
  }
  
  if (Date.now() >= maxEndTime) {
    // 触发超时
    throw new Error(`Command execution timed out after ${commandTimeout}ms`);
  }
}
```

## 安全特性

- ✅ 防止无限循环阻塞
- ✅ 资源释放和清理
- ✅ 详细的错误信息
- ✅ 可配置的超时时间
- ✅ 执行时间统计和日志