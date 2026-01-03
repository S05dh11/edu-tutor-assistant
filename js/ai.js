/**
 * AI对话模块
 * 负责与魔搭社区AI模型的交互
 */

const AI = {
    // API配置 - 使用国内可访问的地址
    API_URL: 'https://api-inference.modelscope.cn/v1/chat/completions',
    // 备用API地址
    API_URL_BACKUP: 'https://api.modelscope.cn/v1/chat/completions',

    // 当前学科
    currentSubject: 'math',

    // 学科对应的系统提示词
    SUBJECT_PROMPTS: {
        math: `你是数学辅导老师小理。

⚠️ 重要限制：每次回答必须控制在50字以内！

擅长：代数、几何、函数、统计。
教学风格：逻辑清晰，步骤详细，引导学生思考。

简洁回答，重点突出解题思路。`,

        chinese: `你是语文辅导老师小文。

⚠️ 重要限制：每次回答必须控制在50字以内！

擅长：阅读理解、古诗文、作文指导。
教学风格：生动形象，注重情感共鸣。

简洁回答，语言优美。`,

        english: `你是英语辅导老师小英。

⚠️ 重要限制：每次回答必须控制在50字以内！

擅长：语法、词汇、口语、写作。
教学风格：耐心细致，鼓励开口。

简洁回答，中英结合。`,

        physics: `你是物理辅导老师小物。

⚠️ 重要限制：每次回答必须控制在50字以内！

擅长：力学、电磁学、光学、实验。
教学风格：直观形象，联系生活实际。

简洁回答，注重原理理解。`
    },

    // 学科信息
    SUBJECT_INFO: {
        math: {
            name: '数学辅导老师小理',
            desc: '擅长代数、几何、函数讲解',
            icon: '📐'
        },
        chinese: {
            name: '语文辅导老师小文',
            desc: '擅长阅读、古诗文、作文指导',
            icon: '📖'
        },
        english: {
            name: '英语辅导老师小英',
            desc: '擅长语法、词汇、口语练习',
            icon: '🔤'
        },
        physics: {
            name: '物理辅导老师小物',
            desc: '擅长概念、公式、实验讲解',
            icon: '⚛️'
        }
    },

    // 快捷问题配置
    QUICK_QUESTIONS: {
        math: [
            '如何快速解一元二次方程？',
            '三角函数公式怎么记忆？',
            '几何证明题的解题思路',
            '如何提高计算准确率？'
        ],
        chinese: [
            '如何快速理解古诗文？',
            '作文开头怎么写才吸引人？',
            '阅读理解找答案的技巧',
            '如何积累好词好句？'
        ],
        english: [
            '英语语法：时态怎么区分？',
            '如何快速背单词？',
            '英语口语练习建议',
            '写作常用句型有哪些？'
        ],
        physics: [
            '牛顿三定律的实际应用',
            '电学公式的记忆技巧',
            '如何分析物理电路图？',
            '力学题的受力分析方法'
        ]
    },

    /**
     * 发送对话请求到魔搭API
     * @param {string} userMessage - 用户消息
     * @param {string} apiKey - API密钥
     * @param {function} onMessage - 流式消息回调
     * @param {function} onComplete - 完成回调
     * @param {function} onError - 错误回调
     */
    async chat(userMessage, apiKey, onMessage, onComplete, onError) {
        const systemPrompt = this.SUBJECT_PROMPTS[this.currentSubject] || this.SUBJECT_PROMPTS.math;

        const requestData = {
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            stream: true,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 800
        };

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API请求失败: ${response.status} ${response.statusText}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (onComplete) {
                        onComplete(fullResponse);
                    }
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            if (onComplete) {
                                onComplete(fullResponse);
                            }
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;

                            if (content) {
                                fullResponse += content;
                                if (onMessage) {
                                    onMessage(content);
                                }
                            }
                        } catch (parseError) {
                            console.warn('解析流式响应失败:', parseError);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('AI对话失败:', error);
            if (onError) {
                onError(error.message);
            }
        }
    },

    /**
     * 设置当前学科
     */
    setSubject(subject) {
        if (this.SUBJECT_PROMPTS[subject]) {
            this.currentSubject = subject;
            console.log('学科已切换:', subject);

            // 更新老师信息
            const info = this.SUBJECT_INFO[subject];
            if (info) {
                const teacherNameEl = document.getElementById('teacher-name');
                const teacherDescEl = document.getElementById('teacher-desc');
                if (teacherNameEl) teacherNameEl.textContent = info.name;
                if (teacherDescEl) teacherDescEl.textContent = info.desc;
            }
        }
    },

    /**
     * 获取当前学科
     */
    getCurrentSubject() {
        return this.currentSubject;
    },

    /**
     * 获取学科信息
     */
    getSubjectInfo(subject) {
        return this.SUBJECT_INFO[subject] || this.SUBJECT_INFO.math;
    },

    /**
     * 获取快捷问题列表
     */
    getQuickQuestions() {
        return this.QUICK_QUESTIONS[this.currentSubject] || this.QUICK_QUESTIONS.math;
    }
};
