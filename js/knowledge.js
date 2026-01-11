/**
 * RAG知识库模块
 * 负责知识存储、检索和管理
 */

const KnowledgeBase = {
    // 存储键名
    STORAGE_KEY: 'edu_tutor_knowledge',

    // 内置学科知识库
    BUILT_IN_KNOWLEDGE: {
        math: {
            name: '数学知识库',
            icon: '📐',
            topics: [
                {
                    id: 'math_001',
                    title: '一元二次方程',
                    keywords: ['一元二次方程', '二次方程', 'ax²+bx+c=0', '解方程', '求根'],
                    content: `一元二次方程是形如ax²+bx+c=0（a≠0）的方程。

解法：
1. 求根公式：x = (-b ± √(b²-4ac)) / 2a
2. 因式分解法：将方程化为(x-x₁)(x-x₂)=0
3. 配方法：将方程配成完全平方式

判别式Δ = b²-4ac：
- Δ > 0：两个不相等的实数根
- Δ = 0：两个相等的实数根
- Δ < 0：无实数根`
                },
                {
                    id: 'math_002',
                    title: '三角函数',
                    keywords: ['三角函数', 'sin', 'cos', 'tan', '正弦', '余弦', '正切'],
                    content: `三角函数基本关系：

1. 同角三角函数关系：
   sin²α + cos²α = 1
   tanα = sinα / cosα
   cotα = cosα / sinα

2. 诱导公式（奇变偶不变，符号看象限）：
   sin(π/2 - α) = cosα
   cos(π/2 - α) = sinα
   sin(π ± α) = ∓ sinα
   cos(π ± α) = -cosα

3. 特殊角值：
   0°: sin=0, cos=1, tan=0
   30°: sin=1/2, cos=√3/2, tan=√3/3
   45°: sin=√2/2, cos=√2/2, tan=1
   60°: sin=√3/2, cos=1/2, tan=√3
   90°: sin=1, cos=0, tan不存在`
                },
                {
                    id: 'math_003',
                    title: '几何证明题方法',
                    keywords: ['几何证明', '证明题', '辅助线', '全等', '相似'],
                    content: `几何证明题解题思路：

1. 分析题意：
   - 明确已知条件（在图中标出）
   - 明确要证明的结论

2. 常用证明方法：
   - 全等三角形证明：SSS, SAS, ASA, AAS, HL
   - 相似三角形证明：AA, SSS, SAS
   - 平行线证明：同位角相等、内错角相等
   - 垂直证明：邻补角、垂直定义

3. 辅助线添加技巧：
   - 连接：连接端点、中点
   - 延长：延长线段、延长交线
   - 平行：过某点作平行线
   - 垂直：过某点作垂线

4. 证明步骤：
   写出"已知"、"求证"，然后"证明"：每步都要有依据`
                },
                {
                    id: 'math_004',
                    title: '函数基础',
                    keywords: ['函数', '定义域', '值域', '一次函数', '二次函数'],
                    content: `函数基础知识：

1. 函数定义：
   设A、B是非空数集，如果按照某种对应法则f，使对于A中每一个元素x，在B中都有唯一元素y与之对应，则称y是x的函数

2. 一次函数 y = kx + b (k≠0)：
   - k > 0：增函数
   - k < 0：减函数
   - b是y轴截距

3. 二次函数 y = ax² + bx + c (a≠0)：
   - 顶点：(-b/2a, (4ac-b²)/4a)
   - 对称轴：x = -b/2a
   - a > 0：开口向上，有最小值
   - a < 0：开口向下，有最大值

4. 定义域求法：
   - 分母不为0
   - 偶次根式≥0
   - 对数真数>0`
                }
            ]
        },
        chinese: {
            name: '语文知识库',
            icon: '📖',
            topics: [
                {
                    id: 'chi_001',
                    title: '古诗文阅读方法',
                    keywords: ['古诗文', '古诗', '文言文', '理解', '翻译'],
                    content: `古诗文阅读理解方法：

1. 通读全文，整体感知：
   - 注意题目、作者、注释
   - 了解写作背景
   - 把握感情基调

2. 逐字逐句，理解含义：
   - 结合注释理解难懂字词
   - 注意古今异义、一词多义
   - 分析特殊句式（倒装、省略）

3. 品味语言，体会情感：
   - 找出诗眼、关键词
   - 分析修辞手法（比喻、拟人、对偶等）
   - 感受意境和情感

4. 常见意象：
   - 月：思乡、思亲
   - 酒：愁绪、豪情
   - 柳：离别、留恋
   - 花：美好、易逝`
                },
                {
                    id: 'chi_002',
                    title: '作文开头技巧',
                    keywords: ['作文', '开头', '写作', '作文技巧'],
                    content: `作文开头写作技巧：

1. 开门见山法：
   直接点明文章主题或观点，简洁明了

2. 设问引用法：
   用问句或名言警句开头，引发读者思考

3. 悬念设置法：
   设置悬念，激发读者阅读兴趣

4. 场景描写法：
   描绘生动场景，营造氛围，引出主题

5. 对比衬托法：
   通过对比突出主题，增强效果

注意事项：
- 开头要简洁，一般不超过全文的1/8
- 要与结尾呼应，形成首尾呼应
- 要符合文体特点`
                },
                {
                    id: 'chi_003',
                    title: '阅读理解答题技巧',
                    keywords: ['阅读理解', '答题', '找答案', '阅读技巧'],
                    content: `阅读理解答题技巧：

1. 先读题目，再读文章：
   - 明确题目要求
   - 带着问题阅读

2. 定位原文，找答案：
   - 关键词定位法
   - 段落对应法
   - 选项排除法

3. 常见题型答题方法：

   ①概括题：找中心句、关键词
   ②理解题：结合上下文，联系语境
   ③赏析题：手法+内容+情感
   ④作用题：内容+结构+主题
   ⑤含义题：表层+深层

4. 答题规范：
   - 分点作答，条理清晰
   - 结合原文，有理有据
   - 语言规范，书写工整`
                }
            ]
        },
        english: {
            name: '英语知识库',
            icon: '🔤',
            topics: [
                {
                    id: 'eng_001',
                    title: '英语时态用法',
                    keywords: ['时态', '现在时', '过去时', '将来时', '时态区分'],
                    content: `英语时态用法总结：

1. 一般现在时：
   - 用法：习惯性动作、客观真理
   - 标志词：always, usually, often, every day

2. 一般过去时：
   - 用法：过去发生的动作或状态
   - 标志词：yesterday, last week, ...ago

3. 一般将来时：
   - 用法：将来发生的动作
   - 结构：will + do / be going to + do
   - 标志词：tomorrow, next week

4. 现在进行时：
   - 用法：正在进行的动作
   - 结构：be + doing
   - 标志词：now, look, listen

5. 过去进行时：
   - 用法：过去某个时刻正在进行的动作
   - 结构：was/were + doing

时态判断技巧：
- 看时间状语
- 看上下文语境
- 看标志词`
                },
                {
                    id: 'eng_002',
                    title: '单词记忆方法',
                    keywords: ['单词', '背单词', '记忆', '词汇'],
                    content: `英语单词高效记忆方法：

1. 词根词缀法：
   - 前缀改变词义（un-不, re-再）
   - 词根决定基本含义（act=行动）
   - 后缀改变词性（-tion名词, -ful形容词）

2. 联想法：
   - 谐音联想
   - 图像联想
   - 故事联想

3. 语境记忆法：
   - 在句子中记忆
   - 在阅读中积累
   - 在运用中巩固

4. 复习规律：
   - 艾宾浩斯遗忘曲线
   - 1天后、3天后、7天后、15天后复习

5. 注意事项：
   - 不要死记硬背
   - 要结合例句
   - 要及时复习`
                },
                {
                    id: 'eng_003',
                    title: '英语写作常用句型',
                    keywords: ['写作', '作文', '句型', '英语写作'],
                    content: `英语写作常用句型：

1. 开头句型：
   - Nowadays, ... is becoming more and more popular.
   - With the development of ..., ...
   - It is generally believed that...

2. 连接句型：
   - 表递进：Besides, Furthermore, What's more
   - 表转折：However, On the contrary, Nevertheless
   - 表因果：Therefore, As a result, Thus
   - 表举例：For example, For instance, Such as

3. 观点句型：
   - In my opinion, ...
   - From my point of view, ...
   - As far as I'm concerned, ...

4. 结尾句型：
   - In conclusion, ...
   - To sum up, ...
   - All in all, ...

写作建议：
- 句式要多样化
- 避免语法错误
- 注意书写规范`
                }
            ]
        },
        physics: {
            name: '物理知识库',
            icon: '⚛️',
            topics: [
                {
                    id: 'phy_001',
                    title: '牛顿三定律',
                    keywords: ['牛顿', '牛顿定律', '惯性', '加速度', '作用力反作用力'],
                    content: `牛顿三大运动定律：

1. 牛顿第一定律（惯性定律）：
   - 内容：一切物体总保持匀速直线运动状态或静止状态，直到有外力迫使它改变这种状态
   - 关键：惯性是物体的固有属性，质量是惯性大小的量度
   - 应用：解释汽车刹车、人向前倾等现象

2. 牛顿第二定律：
   - 公式：F = ma
   - 内容：物体的加速度跟合外力成正比，跟质量成反比
   - 理解：力是产生加速度的原因
   - 应用：计算物体的运动情况

3. 牛顿第三定律：
   - 内容：两个物体之间的作用力和反作用力大小相等、方向相反、作用在同一直线上
   - 特点：同时产生、同时消失、性质相同
   - 应用：走路、划船、火箭发射`

                },
                {
                    id: 'phy_002',
                    title: '电学公式汇总',
                    keywords: ['电学', '欧姆定律', '电功率', '电路', '公式'],
                    content: `电学核心公式总结：

1. 欧姆定律：
   - I = U / R （电流=电压/电阻）
   - U = IR
   - R = U / I

2. 电功和电功率：
   - W = UIt = Pt （电功）
   - P = UI = I²R = U²/R （电功率）
   - Q = I²Rt （焦耳热）

3. 串联电路：
   - I = I₁ = I₂ = ...
   - U = U₁ + U₂ + ...
   - R = R₁ + R₂ + ...

4. 并联电路：
   - I = I₁ + I₂ + ...
   - U = U₁ = U₂ = ...
   - 1/R = 1/R₁ + 1/R₂ + ...

5. 电路分析步骤：
   - 识别串并联关系
   - 画出等效电路图
   - 选择合适公式计算`
                },
                {
                    id: 'phy_003',
                    title: '受力分析方法',
                    keywords: ['受力分析', '力学', '重力', '支持力', '摩擦力'],
                    content: `物体受力分析方法：

1. 受力分析步骤：
   ①确定研究对象
   ②按顺序画力：
     - 重力 G = mg（永远竖直向下）
     - 弹力（支持力、拉力）
     - 摩擦力（静摩擦、滑动摩擦）
     - 其他力（浮力、电场力等）

2. 力的合成与分解：
   - 平行四边形定则
   - 正交分解法（最常用）
     - 建立坐标系
     - 分解各力
     - 列方程求解

3. 常见模型：
   - 斜面模型：重力沿斜面和垂直斜面分解
   - 连接体模型：整体法和隔离法结合
   - 圆周运动：向心力分析

注意事项：
- 不要漏力、不要添力
- 明确力的施力物体
- 注意力的方向`
                }
            ]
        }
    },

    // 用户自定义知识库
    customKnowledge: {},

    /**
     * 初始化知识库
     */
    init() {
        this.loadCustomKnowledge();
    },

    /**
     * 加载用户自定义知识库
     */
    loadCustomKnowledge() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.customKnowledge = JSON.parse(stored);
            }
        } catch (e) {
            console.error('加载自定义知识库失败:', e);
            this.customKnowledge = {};
        }
    },

    /**
     * 保存用户自定义知识库
     */
    saveCustomKnowledge() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.customKnowledge));
            return true;
        } catch (e) {
            console.error('保存自定义知识库失败:', e);
            return false;
        }
    },

    /**
     * 根据关键词检索相关知识点
     * @param {string} query - 查询内容
     * @param {string} subject - 学科
     * @returns {Array} 匹配的知识点列表
     */
    search(query, subject) {
        const results = [];
        const keywords = this.extractKeywords(query);
        const subjectKnowledge = this.BUILT_IN_KNOWLEDGE[subject];

        if (!subjectKnowledge) return results;

        // 搜索内置知识库
        for (const topic of subjectKnowledge.topics) {
            let score = 0;
            const queryLower = query.toLowerCase();

            // 检查标题匹配
            if (topic.title.toLowerCase().includes(queryLower)) {
                score += 10;
            }

            // 检查关键词匹配
            for (const keyword of topic.keywords) {
                if (queryLower.includes(keyword.toLowerCase()) ||
                    keyword.toLowerCase().includes(queryLower)) {
                    score += 5;
                }
            }

            // 检查内容匹配
            if (topic.content.toLowerCase().includes(queryLower)) {
                score += 3;
            }

            if (score > 0) {
                results.push({
                    ...topic,
                    score: score,
                    source: 'builtin'
                });
            }
        }

        // 搜索自定义知识库
        const customTopics = this.customKnowledge[subject] || [];
        for (const topic of customTopics) {
            let score = 0;
            const queryLower = query.toLowerCase();

            if (topic.title.toLowerCase().includes(queryLower)) score += 10;
            for (const keyword of topic.keywords || []) {
                if (queryLower.includes(keyword.toLowerCase())) score += 5;
            }
            if (topic.content.toLowerCase().includes(queryLower)) score += 3;

            if (score > 0) {
                results.push({
                    ...topic,
                    score: score,
                    source: 'custom'
                });
            }
        }

        // 按相关性排序
        results.sort((a, b) => b.score - a.score);

        // 返回前3个最相关的结果
        return results.slice(0, 3);
    },

    /**
     * 提取关键词
     */
    extractKeywords(text) {
        // 简单分词（实际应用可使用更复杂的分词算法）
        return text.split(/[\s,，.。!！?？]+/).filter(word => word.length > 1);
    },

    /**
     * 添加自定义知识点
     */
    addCustomTopic(subject, topic) {
        if (!this.customKnowledge[subject]) {
            this.customKnowledge[subject] = [];
        }
        topic.id = `custom_${Date.now()}`;
        this.customKnowledge[subject].push(topic);
        this.saveCustomKnowledge();
        return topic;
    },

    /**
     * 删除自定义知识点
     */
    deleteCustomTopic(subject, topicId) {
        if (!this.customKnowledge[subject]) return false;
        this.customKnowledge[subject] = this.customKnowledge[subject].filter(
            t => t.id !== topicId
        );
        this.saveCustomKnowledge();
        return true;
    },

    /**
     * 获取学科所有知识点
     */
    getTopicsBySubject(subject) {
        const builtin = this.BUILT_IN_KNOWLEDGE[subject]?.topics || [];
        const custom = this.customKnowledge[subject] || [];
        return {
            builtin: builtin,
            custom: custom,
            all: [...builtin, ...custom]
        };
    },

    /**
     * 格式化知识为RAG上下文
     */
    formatAsContext(results) {
        if (results.length === 0) return '';

        let context = '\n【参考知识库】\n';
        results.forEach((item, index) => {
            context += `\n${index + 1}. ${item.title}\n`;
            context += `${item.content}\n`;
        });
        return context;
    }
};

// 初始化知识库
KnowledgeBase.init();
