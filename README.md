```
npx -y hyper-mcp-terminal
```



## 普通安装
command:  npx

args:  -y hyper-mcp-terminal

env:  
    // 通过输出不变来判断是否结束 默认是 15次，检测间隔是100ms，也就是1.5s输出一直不变，表示命令结束了
    Terminal_End_CheckCount || 15;
    // 终端输出最大长度给大模型的
    Terminal_Output_MaxToken || 10000 
    //终端 5分钟 没输入挂掉
    process.env.Terminal_Timeout || 5 * 60 * 1000 



## 使用图片

![e679a8b4e0924b882753edd3d2392a2d](https://github.com/user-attachments/assets/981a7047-ab87-4fb3-a77a-c5d5f2a815cf)
![4fd6cf2aff7f2e13ed1993e297129db4](https://github.com/user-attachments/assets/9e1067b8-ef1c-4d7b-8d68-31053f1001d8)
![c98448b8e31e062f7fd7e6a07c9d487a](https://github.com/user-attachments/assets/d67dd8f9-4658-4e79-986a-1bbe4d855c92)


## Usage

### hyperchat安装方式  [下载地址](https://github.com/BigSweetPotatoStudio/HyperChat)

![image](https://github.com/user-attachments/assets/c40feb2c-48cf-4965-b743-7ccd12f6b207)