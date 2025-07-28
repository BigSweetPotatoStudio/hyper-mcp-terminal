// 测试提示符识别
const promptPatterns = [
  // Bash/Zsh 常见格式
  /[\$#]\s*$/,                          // 简单的 $ 或 # 结尾
  /\w+@\w+.*[\$#]\s*$/,                 // user@host:path$ 格式
  /➜.*[\$#]\s*$/,                       // zsh arrow prompt
  /.*:.*[\$#]\s*$/,                     // path:$ 格式

  // Windows 命令行
  /[A-Z]:\\.*>\s*$/,                    // C:\path> 格式  
  
  // PowerShell 提示符（各种格式）
  /PS\s+[A-Z]:\\.*>\s*$/,               // PowerShell PS C:\path>
  /PS\s+[A-Z]:[^>]*>\s*$/,              // PowerShell PS C:\Users\username>
  /PS\s+[A-Za-z]:[\\\/][^>]*>\s*$/,     // PowerShell PS C:\path 或 PS c:/path>
  /PS\s+.*>\s*$/,                       // 任何包含 PS 的格式（移除 ^ 锚点）
  
  // Conda 环境
  /\([^)]+\)\s*PS\s+[A-Z]:\\.*>\s*$/,   // conda环境 (base) PS C:\path>
  /\([^)]+\)\s*[A-Z]:\\.*>\s*$/,        // conda环境 (base) C:\path>

  // Fish shell
  /\w+@\w+.*>\s*$/,                     // user@host path>

  // Conda environments (跨平台)
  /\([^)]+\).*[\$#>]\s*$/,              // (env_name) 前缀的提示符

  // 通用模式 - 更宽松的匹配
  /.*[\$#>]\s*$/,                       // 以 $, #, > 结尾
  /.*[:\]]\s*[\$#>]\s*$/,               // 带路径分隔符的提示符
];

// 测试用例
const testCases = [
  "PS C:\\Users\\0laop>",
  "PS C:\\>", 
  "PS C:\\path\\to\\folder>",
  "(base) PS C:\\Users\\0laop>",
  "C:\\Users\\0laop>",
  "user@host:~$",
  "➜ ~ $"
];

console.log("测试提示符识别：\n");

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: "${testCase}"`);
  
  const matched = promptPatterns.some((pattern, patternIndex) => {
    const isMatch = pattern.test(testCase);
    if (isMatch) {
      console.log(`  ✅ 匹配模式 ${patternIndex}: ${pattern}`);
      return true;
    }
    return false;
  });
  
  if (!matched) {
    console.log(`  ❌ 没有匹配的模式`);
  }
  
  console.log("");
});