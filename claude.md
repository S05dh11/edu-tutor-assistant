# 学科辅导智能助手 - 开发文档

## 项目概述

**参赛信息**
- 黑客松：魔珐星云具身智能黑客松 2025
- 赛道：AI实时交互教育赛道
- 方向：学科辅导：精准易懂的学习知识讲解
- 开发周期：2025.12.22 - 2026.1.25

**项目定位**
面向K12教育的AI智能辅导老师，通过数字人形象提供实时互动的学科知识讲解服务。

**核心理念**
星云让 AI 拥有"老师的身体与对话能力"，把学习从"看内容"升级为一个能实时对话、能引导学习、能陪练的AI老师。

## 技术架构

### 技术栈
| 技术 | 用途 |
|------|------|
| HTML5/CSS3 | 页面结构与样式 |
| 原生JavaScript (ES6+) | 业务逻辑 |
| 魔珐星云JS SDK | 数字人渲染与驱动 |
| 魔搭社区API | AI大模型对话 |
| LocalStorage | 密钥本地存储 |

### 核心模块
```
edu-tutor-assistant/
├── index.html          # 单页面主入口
├── css/
│   └── style.css      # 样式文件
├── js/
│   ├── config.js      # 配置管理（密钥存储）
│   ├── avatar.js      # 数字人SDK封装
│   ├── ai.js          # AI对话模块
│   ├── ui.js          # UI交互控制
│   └── main.js        # 程序入口
└── claude.md          # 本文档
```

## 核心功能

### 1. 学科选择
支持多学科切换，每个学科有专属的辅导风格和知识范围：
- 数学（逻辑推理、公式讲解）
- 语文（阅读理解、作文指导）
- 英语（语法讲解、口语练习）
- 物理（概念解释、实验演示）

### 2. 智能对话
- 接入魔搭社区AI模型（推荐 Qwen 系列）
- 流式响应显示
- 针对不同学科定制系统提示词
- 支持快捷问题模板

### 3. 数字人交互
基于魔珐星云JS SDK实现：
- 实时3D数字人渲染
- 语音合成与口型同步
- 多状态行为控制（待机/倾听/思考/说话）
- 字幕实时显示

### 4. 密钥管理
- LocalStorage存储密钥
- 手动输入界面
- 内置测试密钥支持

## SDK接入详解

### 魔珐星云SDK

**引入方式**
```html
<script src="https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js"></script>
```

**创建实例**
```javascript
const sdk = new XmovAvatar({
    containerId: '#avatar-container',
    appId: 'your_app_id',
    appSecret: 'your_app_secret',
    gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

    // 核心回调
    onMessage: (message) => {
        // 处理SDK消息和错误
    },
    onStateChange: (state) => {
        // 状态变化：idle/listen/think/speak/interactive_idle
    },
    onStatusChange: (status) => {
        // 连接状态：0=online, 1=offline, 2=network_on, 3=network_off, 4=close
    },
    onVoiceStateChange: (status) => {
        // 语音状态：start/end
    },

    enableLogger: false
});
```

**关键方法**
```javascript
// 初始化（加载资源）
await sdk.init({
    onDownloadProgress: (progress) => {
        console.log(`下载进度: ${progress}%`);
    }
});

// 控制数字人说话
speak(text, isStart, isEnd)

// 状态切换
idle()              // 待机
listen()            // 倾听
think()             // 思考
interactive_idle()  // 互动待机

// 销毁
destroy()
```

**数字人状态流转**
```
离线模式 ← → 在线模式
    ↓
待机等待
    ↓
倾听 ← → 思考 ← → 说话
    ↑              ↓
    └──────────────┘
```

### 魔搭AI API

**API地址**
```
https://api-inference.modelscope.cn/v1/chat/completions
```

**请求格式**
```javascript
const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 800
    })
});
```

**流式响应处理**
```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
                // 处理流式内容
            }
        }
    }
}
```

## 页面布局设计

```
┌─────────────────────────────────────────────────────┐
│               🎓 AI学科辅导助手                      │
├──────────────────┬──────────────────────────────────┤
│                  │  [数学] [语文] [英语] [物理]       │
│                  ├──────────────────────────────────┤
│   数字人展示区    │                                  │
│                  │  📚 对话记录区域                  │
│    ┌──────────┐  │  ┌────────────────────────────┐ │
│    │          │  │  │ 学生: 这个公式怎么推导？    │ │
│    │  3D数字人 │  │  │ 老师: 好问题！我们来详细   │ │
│    │          │  │  │ 看看...                     │ │
│    └──────────┘  │  └────────────────────────────┘ │
│   [字幕显示]     │                                  │
│                  │  ⚡ 快捷问题                     │
│   AI辅导老师     │  [选择题技巧] [公式记忆] [错题]  │
├──────────────────┴──────────────────────────────────┤
│ [连接] [断开] │ [密钥配置] │ [诊断] │ [清空]        │
└─────────────────────────────────────────────────────┘
```

## 关键实现要点

### 1. 分段播放长文本
由于SDK对单次speak有长度限制，需要实现分段播放：
```javascript
// 超过30字的文本分段播放
const MAX_LENGTH = 30;

if (text.length <= MAX_LENGTH) {
    sdk.speak(text, true, true);  // 直接播放
} else {
    // 分段播放，每段之间切换listen状态
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
        const chunk = text.substring(i, i + MAX_LENGTH);
        if (i > 0) {
            sdk.listen();  // 重置状态
            await sleep(500);
        }
        sdk.speak(chunk, true, true);
        await sleep(800);  // 等待播放完成
    }
}
```

### 2. 状态管理
确保数字人状态切换的正确顺序：
```
用户提问 → listen(倾听) → think(思考) → speak(说话) → idle(待机)
```

### 3. 错误处理
常见错误码：
- 10001: 容器不存在
- 10003: 会话初始化失败（检查密钥和应用配置）
- 10005: 房间限流（等待几分钟后重试）
- 50001: 网络离线
- 50004: 网络断开

### 4. 本地开发
由于浏览器安全策略，数字人音频需要使用HTTP/HTTPS协议：
```bash
# 使用Python启动本地服务器
python -m http.server 8000
# 或使用Node.js
npx serve
```

访问：http://localhost:8000

## 系统提示词设计

### 数学辅导
```
你是数学辅导老师小理。

⚠️ 重要限制：每次回答控制在50字以内。

擅长：代数、几何、函数、统计。
教学风格：逻辑清晰，步骤详细，引导学生思考。

简洁回答，重点突出解题思路。
```

### 语文辅导
```
你是语文辅导老师小文。

⚠️ 重要限制：每次回答控制在50字以内。

擅长：阅读理解、古诗文、作文指导。
教学风格：生动形象，注重情感共鸣。

简洁回答，语言优美。
```

### 英语辅导
```
你是英语辅导老师小英。

⚠️ 重要限制：每次回答控制在50字以内。

擅长：语法、词汇、口语、写作。
教学风格：耐心细致，鼓励开口。

简洁回答，中英结合。
```

### 物理辅导
```
你是物理辅导老师小物。

⚠️ 重要限制：每次回答控制在50字以内。

擅长：力学、电磁学、光学、实验。
教学风格：直观形象，联系生活实际。

简洁回答，注重原理理解。
```

## 快捷问题设计

每个学科预置4个高频问题：

**数学**
- "如何快速解一元二次方程？"
- "三角函数公式怎么记忆？"
- "几何证明题的解题思路"
- "如何提高计算准确率？"

**语文**
- "如何快速理解古诗文？"
- "作文开头怎么写才吸引人？"
- "阅读理解找答案的技巧"
- "如何积累好词好句？"

**英语**
- "英语语法：时态怎么区分？"
- "如何快速背单词？"
- "英语口语练习建议"
- "写作常用句型有哪些？"

**物理**
- "牛顿三定律的实际应用"
- "电学公式的记忆技巧"
- "如何分析物理电路图？"
- "力学题的受力分析方法"

## 开发计划

### 阶段一：基础搭建（Day 1-2）
- [x] 创建项目结构
- [x] 实现密钥配置模块
- [x] 集成数字人SDK
- [x] 实现基础UI布局

### 阶段二：核心功能（Day 3-5）
- [ ] 实现AI对话模块
- [ ] 实现学科切换
- [ ] 实现数字人状态控制
- [ ] 实现分段播放

### 阶段三：优化完善（Day 6-7）
- [ ] 添加字幕显示
- [ ] 优化提示词
- [ ] 快捷问题模板
- [ ] 错误处理优化

### 阶段四：测试提交（Day 8-10）
- [ ] 完整功能测试
- [ ] 录制Demo视频
- [ ] 准备展示材料
- [ ] 提交参赛作品

## 测试清单

### SDK连通性测试
- [ ] 数字人能正常连接
- [ ] 语音能正常播放
- [ ] 状态切换正常
- [ ] 分段播放稳定

### AI对话测试
- [ ] 各学科回答准确
- [ ] 流式响应正常
- [ ] 快捷问题可用
- [ ] 错误处理正确

### 用户体验测试
- [ ] 界面友好美观
- [ ] 操作流畅自然
- [ ] 字幕清晰可见
- [ ] 响应及时

## 注意事项

1. **SDK版本**：使用最新版 `xmovAvatar@latest.js` 以获取最新特性
2. **HTTPS要求**：生产环境必须使用HTTPS协议
3. **资源加载**：首次连接需要下载资源（约50-100MB），注意进度提示
4. **状态管理**：避免在speak过程中连续调用，中间需切换状态
5. **积分消耗**：调试时建议使用基础音色，空闲时切换离线模式
6. **浏览器兼容**：推荐使用Chrome 90+、Edge 90+、Safari 14+

## 参考资料

- [魔珐星云SDK文档](https://xingyun3d.com/developers/52-183)
- [魔搭社区API文档](https://api.modelscope.cn/)
- [黑客松官网](https://pre.xingyun3d.com/hackathon2025/)

---

**开发目标**
打造一个让K12学生能随时获得专业、耐心的AI学科辅导服务，真正做到精准易懂、实时互动。
