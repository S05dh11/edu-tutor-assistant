/**
 * 场景管理模块
 * 提供教育教学、培训、考核、评测等不同教学场景
 */

const Scenario = {
    // 当前场景
    currentScenario: 'teaching',

    // 场景定义
    SCENARIOS: {
        teaching: {
            id: 'teaching',
            name: '教育教学',
            icon: '📚',
            description: '知识讲解与概念解析',
            prompt: `你是辅导老师，正在为学生讲解知识点。

⚠️ 重要限制：每次回答必须控制在60字以内。

教学风格：
1. 先解释概念定义
2. 再说明关键要点
3. 最后给出记忆技巧

请用简洁清晰的语言讲解，确保学生能快速理解。`,
            quickQuestions: [
                '讲解这个知识点',
                '举例说明',
                '有什么记忆技巧？',
                '今日总结'
            ]
        },

        training: {
            id: 'training',
            name: '培训演练',
            icon: '📝',
            description: '例题演示与解题技巧',
            prompt: `你是辅导老师，正在通过例题演示教学。

⚠️ 重要限制：每次回答必须控制在80字以内。

教学风格：
1. 先分析题目考查点
2. 再展示解题步骤
3. 最后总结解题方法

请详细展示解题过程，帮助学生掌握方法。`,
            quickQuestions: [
                '出一道例题',
                '分析解题思路',
                '有哪些易错点？',
                '今日总结'
            ]
        },

        assessment: {
            id: 'assessment',
            name: '考核测试',
            icon: '📋',
            description: '出题测试与答案解析',
            prompt: `你是辅导老师，正在对学生进行考核测试。

⚠️ 重要限制：每次回答必须控制在50字以内。

⚠️ 每次出题必须不同，随机变化题型和数值！

请：
1. 先出一道测试题（不要给出答案）- 每次题目要不同
2. 等学生回答后再给出正确答案和解析
3. 根据学生回答判断对错并给出评价

一次只出一道题，确保学生有时间思考。`,
            quickQuestions: [
                '出题考考我',
                '我刚才答对了吗？',
                '详细解析这道题',
                '今日总结'
            ]
        },

        evaluation: {
            id: 'evaluation',
            name: '学习评估',
            icon: '📊',
            description: '学习进度与能力评估',
            prompt: `你是辅导老师，正在对学生的学习情况进行评估。

⚠️ 重要限制：每次回答必须控制在60字以内。

请从以下方面评估：
1. 知识掌握程度
2. 理解能力水平
3. 学习建议

给出客观的评估和改进建议，帮助学生进步。`,
            quickQuestions: [
                '评估我的学习情况',
                '我哪里需要加强？',
                '给出学习建议',
                '今日总结'
            ]
        },

        speaking: {
            id: 'speaking',
            name: '口语陪练',
            icon: '🗣️',
            description: '英语口语对话练习',
            prompt: `你是英语口语陪练老师，正在与学生进行口语对话练习。

⚠️ 重要限制：每次回答必须控制在40字以内。

教学风格：
1. 用简单英语进行对话
2. 纠正学生的语法错误
3. 提供更地道的表达方式
4. 鼓励学生多说多练

如果学生用中文提问，用英语回答并提供中文翻译。
让学生在真实的对话场景中练习英语口语。`,
            quickQuestions: [
                'How are you?',
                'Introduce yourself',
                'Tell me about your hobby',
                '今日总结'
            ],
            // 口语陪练专用对话库
            conversations: [
                {
                    topic: '自我介绍',
                    questions: [
                        'Could you introduce yourself?',
                        'What do you like to do in your free time?',
                        'What is your favorite subject?'
                    ]
                },
                {
                    topic: '日常问候',
                    questions: [
                        'How are you today?',
                        'What did you do yesterday?',
                        'What are your plans for tomorrow?'
                    ]
                },
                {
                    topic: '兴趣爱好',
                    questions: [
                        'Do you like reading? Why?',
                        'What sports do you enjoy?',
                        'Tell me about your favorite movie.'
                    ]
                },
                {
                    topic: '校园生活',
                    questions: [
                        'How do you go to school every day?',
                        'What do you usually do after school?',
                        'Do you like your school?'
                    ]
                }
            ]
        }
    },

    /**
     * 初始化场景模块
     */
    init() {
        console.log('场景管理模块已初始化');
    },

    /**
     * 获取所有场景列表
     */
    getAllScenarios() {
        return Object.values(this.SCENARIOS);
    },

    /**
     * 获取场景信息
     */
    getScenario(scenarioId) {
        return this.SCENARIOS[scenarioId] || this.SCENARIOS.teaching;
    },

    /**
     * 设置当前场景
     */
    setCurrentScenario(scenarioId) {
        if (this.SCENARIOS[scenarioId]) {
            this.currentScenario = scenarioId;
            console.log('场景已切换:', this.getScenario(scenarioId).name);
            return true;
        }
        return false;
    },

    /**
     * 获取当前场景
     */
    getCurrentScenario() {
        return this.getScenario(this.currentScenario);
    },

    /**
     * 获取当前场景的提示词
     */
    getCurrentPrompt() {
        const scenario = this.getCurrentScenario();
        return scenario ? scenario.prompt : this.SCENARIOS.teaching.prompt;
    },

    /**
     * 获取当前场景的快捷问题
     */
    getCurrentQuickQuestions() {
        const scenario = this.getCurrentScenario();
        return scenario ? scenario.quickQuestions : this.SCENARIOS.teaching.quickQuestions;
    },

    /**
     * 获取口语陪练对话库
     */
    getSpeakingConversations() {
        const scenario = this.getScenario('speaking');
        return scenario ? scenario.conversations : [];
    },

    /**
     * 随机获取一个口语陪练问题
     */
    getRandomSpeakingQuestion() {
        const conversations = this.getSpeakingConversations();
        if (conversations.length === 0) return '';

        // 随机选择一个话题
        const randomTopic = conversations[Math.floor(Math.random() * conversations.length)];
        const randomQuestions = randomTopic.questions;

        // 随机选择该话题下的一个问题
        return randomQuestions[Math.floor(Math.random() * randomQuestions.length)];
    }
};
