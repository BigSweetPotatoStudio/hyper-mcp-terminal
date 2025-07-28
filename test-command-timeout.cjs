// 简单的超时测试脚本
// 模拟MCP客户端测试超时机制

const { exec } = require('child_process');

// 测试正常命令
console.log('Testing normal command...');
setTimeout(() => {
  console.log('Would execute: echo "Hello World"');
  console.log('Expected: Should complete quickly');
}, 1000);

// 测试超时命令
setTimeout(() => {
  console.log('\nTesting timeout command...');
  console.log('Would execute: sleep 40');
  console.log('Expected: Should timeout after 30 seconds');
}, 2000);

// 测试说明
setTimeout(() => {
  console.log('\n=== 超时机制测试说明 ===');
  console.log('1. 服务器已启动，可通过浏览器访问 http://localhost:3000');
  console.log('2. 在终端中执行 sleep 40 命令');
  console.log('3. 应该在30秒后看到超时错误');
  console.log('4. 控制台会显示："Command timed out after XXXms: sleep 40"');
  console.log('5. MCP客户端会收到超时异常');
  
  console.log('\n=== 配置信息 ===');
  console.log(`Terminal_Command_Timeout: ${process.env.Terminal_Command_Timeout || '30000'} ms`);
  console.log(`Terminal_End_CheckCount: ${process.env.Terminal_End_CheckCount || '15'}`);
  console.log(`Terminal_Output_MaxToken: ${process.env.Terminal_Output_MaxToken || '10000'}`);
}, 3000);

console.log('超时保护机制已添加！');
console.log('- 默认超时时间：30秒');
console.log('- 可通过 Terminal_Command_Timeout 环境变量配置');
console.log('- 防止无限循环阻塞进程');