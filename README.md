```
npx -y hyper-mcp-terminal
```



## 普通安装

```
command:  npx

args:  -y hyper-mcp-terminal

env:  
    //(可选) 通过输出不变来判断是否结束 默认是 15次，检测间隔是100ms，也就是1.5s输出一直不变，表示命令结束了
    Terminal_End_CheckCount || 15;
    //(可选) 终端输出最大长度给大模型的
    Terminal_Output_MaxToken || 10000 
    //(可选) 终端 5分钟 没输入挂掉
    Terminal_Timeout || 5 * 60 * 1000 
```

### 失败解决办法

1. 很多人安装失败，可能是这个依赖微软的[node-pty](https://github.com/microsoft/node-pty?tab=readme-ov-file#dependencies)，它又依赖C++环境。[教程][node-pty](https://github.com/microsoft/node-pty?tab=readme-ov-file#dependencies)

## 使用图片

![image](https://github.com/user-attachments/assets/5c79e0c6-1f0c-4fac-ba77-13609e5e32c4)

![image](https://github.com/user-attachments/assets/3488724b-f061-454d-bfb3-06c69e0e2f83)


![image](https://github.com/user-attachments/assets/0fcfab81-b5e8-49bb-b990-eee5dcda1b29)



## Usage

### hyperchat安装方式  [下载地址](https://github.com/BigSweetPotatoStudio/HyperChat)

![image](https://github.com/user-attachments/assets/5b82fd2b-64f1-405a-afea-130052995f52)

