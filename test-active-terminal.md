# 活跃终端跟踪测试

## 测试步骤

### 1. 启动应用并创建多个标签页
```bash
npm run dev
# 在浏览器中打开 http://localhost:3000
# 创建3个标签页
```

### 2. 在不同标签页设置不同的工作目录
- **标签页1**: `cd /tmp && pwd`
- **标签页2**: `cd /home && pwd`  
- **标签页3**: `cd /var && pwd`

### 3. 测试MCP命令执行
切换到不同标签页，然后在MCP客户端执行：
```bash
# 应该在当前活跃标签页执行
npx -y hyper-mcp-terminal
```

### 4. 验证结果
- MCP命令应该在当前活跃的标签页中执行
- 工作目录应该与活跃标签页一致
- 命令输出应该出现在活跃标签页中

## 实现原理

### 前端活跃跟踪
- 标签页切换时发送 `set-active-terminal` 事件
- 新建标签页时自动设为活跃终端

### 后端状态同步
- 监听 `set-active-terminal` 事件
- 更新 `globalLastTerminalID` 为活跃终端ID
- MCP的 `execute-command` 使用活跃终端执行

### 关键代码变更
```typescript
// 前端：标签页切换时通知后端
socket.emit('set-active-terminal', { sessionId: newActiveKey });

// 后端：更新活跃终端ID
socket.on("set-active-terminal", ({ sessionId }) => {
  setActiveTerminalID(terminalID);
});

// MCP：使用活跃终端执行命令
terminalID = lastTerminalID; // 现在是最后活动的，不是最后创建的
```

## 预期行为
✅ MCP命令在用户当前查看的标签页执行  
✅ 工作目录、环境变量等上下文正确  
✅ AI助手看到的输出与用户一致  
✅ 多标签页工作流更加直观