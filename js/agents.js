/**
 * Multi-Agent框架
 * 通过多个专门Agent协作提高准确度、降低幻觉率
 */

const AgentSystem = {
    // Agent状态追踪
    activeAgent: null,
    agentHistory: [],

    // Agent定义
    AGENTS: {
        retriever: {
            name: '检索Agent',
            icon: '🔍',
            description: '从知识库检索相关内容',
            color: '#2196F3'
        },
        analyzer: {
            name: '分析Agent',
            icon: '🧠',
            description: '分析学生问题和知识水平',
            color: '#9C27B0'
        },
        designer: {
            name: '设计Agent',
            icon: '📋',
            description: '设计教学策略和回答结构',
            color: '#FF9800'
        },
        validator: {
            name: '验证Agent',
            icon: '✅',
            description: '验证答案的准确性和安全性',
            color: '#4CAF50'
        },
        generator: {
            name: '生成Agent',
            icon: '✏️',
            description: '生成最终回答内容',
            color: '#00BCD4'
        }
    },

    /**
     * 协作处理流程
     * @param {string} userMessage - 用户消息
     * @param {string} subject - 学科
     * @param {string} apiKey - API密钥
     * @param {function} onProgress - 进度回调
     * @param {function} onComplete - 完成回调
     * @param {function} onError - 错误回调
     */
    async process(userMessage, subject, apiKey, onProgress, onComplete, onError) {
        this.agentHistory = [];
        let context = { userMessage, subject, apiKey };

        try {
            // 1. 检索Agent：从知识库获取相关信息
            context = await this.runRetrieverAgent(context, onProgress);
            if (context.error) throw new Error(context.error);

            // 2. 分析Agent：分析学生问题类型和知识水平
            context = await this.runAnalyzerAgent(context, onProgress);
            if (context.error) throw new Error(context.error);

            // 3. 设计Agent：设计教学策略
            context = await this.runDesignerAgent(context, onProgress);
            if (context.error) throw new Error(context.error);

            // 4. 生成Agent：生成回答内容
            context = await this.runGeneratorAgent(context, onProgress);
            if (context.error) throw new Error(context.error);

            // 5. 验证Agent：验证答案质量
            context = await this.runValidatorAgent(context, onProgress);
            if (context.error) throw new Error(context.error);

            // 完成
            if (onComplete) {
                onComplete(context.finalAnswer || context.generatedAnswer, context);
            }

        } catch (error) {
            console.error('Agent处理失败:', error);
            if (onError) {
                onError(error.message);
            }
        } finally {
            this.activeAgent = null;
        }
    },

    /**
     * 检索Agent：从知识库检索相关内容
     */
    async runRetrieverAgent(context, onProgress) {
        this.setActiveAgent('retriever', onProgress);
        await this.sleep(300);

        const { userMessage, subject } = context;
        const relevantTopics = KnowledgeBase.search(userMessage, subject);

        this.addAgentHistory('retriever', {
            query: userMessage,
            found: relevantTopics.length,
            topics: relevantTopics.map(t => t.title)
        });

        // 更新UI日志
        if (typeof UI !== 'undefined') {
            UI.updateAgentCard('retriever', 'idle', '完成');
            UI.addAgentLog('retriever', `检索到${relevantTopics.length}个相关知识`);
        }

        return {
            ...context,
            retrievedKnowledge: relevantTopics,
            knowledgeContext: KnowledgeBase.formatAsContext(relevantTopics)
        };
    },

    /**
     * 分析Agent：分析学生问题
     */
    async runAnalyzerAgent(context, onProgress) {
        this.setActiveAgent('analyzer', onProgress);
        await this.sleep(400);

        const { userMessage, subject, retrievedKnowledge } = context;

        // 分析问题类型
        const questionType = this.analyzeQuestionType(userMessage);

        // 分析知识复杂度
        const complexity = this.analyzeComplexity(userMessage, retrievedKnowledge);

        this.addAgentHistory('analyzer', {
            questionType,
            complexity,
            hasKnowledge: retrievedKnowledge.length > 0
        });

        // 更新UI日志
        if (typeof UI !== 'undefined') {
            UI.updateAgentCard('analyzer', 'idle', '完成');
            UI.addAgentLog('analyzer', `问题类型: ${questionType}, 复杂度: ${complexity}`);
        }

        return {
            ...context,
            questionType,
            complexity
        };
    },

    /**
     * 设计Agent：设计教学策略
     */
    async runDesignerAgent(context, onProgress) {
        this.setActiveAgent('designer', onProgress);
        await this.sleep(300);

        const { questionType, complexity, retrievedKnowledge, subject } = context;

        // 根据问题类型和复杂度设计策略
        const strategy = this.designStrategy(questionType, complexity, subject);

        // 设计回答结构
        const structure = this.designAnswerStructure(questionType, strategy);

        this.addAgentHistory('designer', {
            strategy,
            structure
        });

        // 更新UI日志
        if (typeof UI !== 'undefined') {
            UI.updateAgentCard('designer', 'idle', '完成');
            UI.addAgentLog('designer', `策略: ${strategy}`);
        }

        return {
            ...context,
            teachingStrategy: strategy,
            answerStructure: structure
        };
    },

    /**
     * 生成Agent：生成回答内容
     */
    async runGeneratorAgent(context, onProgress) {
        this.setActiveAgent('generator', onProgress);

        const { userMessage, subject, apiKey, knowledgeContext, teachingStrategy, answerStructure } = context;

        // 构建增强的提示词
        const enhancedPrompt = this.buildEnhancedPrompt(
            subject,
            knowledgeContext,
            teachingStrategy,
            answerStructure
        );

        // 调用AI生成回答
        return new Promise((resolve, reject) => {
            let fullResponse = '';

            AI.callLLM(userMessage, enhancedPrompt, apiKey, {
                onMessage: (chunk) => {
                    fullResponse += chunk;
                    if (onProgress) {
                        onProgress({
                            agent: 'generator',
                            status: 'streaming',
                            content: chunk
                        });
                    }
                },
                onComplete: () => {
                    this.addAgentHistory('generator', {
                        length: fullResponse.length,
                        preview: fullResponse.substring(0, 50) + '...'
                    });

                    // 更新UI日志
                    if (typeof UI !== 'undefined') {
                        UI.updateAgentCard('generator', 'idle', '完成');
                        UI.addAgentLog('generator', `生成回答: ${fullResponse.length}字`);
                    }

                    resolve({
                        ...context,
                        generatedAnswer: fullResponse
                    });
                },
                onError: (error) => {
                    reject(new Error(error));
                }
            });
        });
    },

    /**
     * 验证Agent：验证答案质量
     */
    async runValidatorAgent(context, onProgress) {
        this.setActiveAgent('validator', onProgress);
        await this.sleep(500);

        const { generatedAnswer, questionType, retrievedKnowledge } = context;

        // 多维度验证
        const validation = this.validateAnswer(generatedAnswer, {
            length: generatedAnswer.length,
            hasKnowledge: retrievedKnowledge.length > 0,
            questionType: questionType
        });

        this.addAgentHistory('validator', {
            validation,
            score: validation.score
        });

        // 更新UI日志
        if (typeof UI !== 'undefined') {
            UI.updateAgentCard('validator', 'idle', validation.passed ? '通过' : '需改进');
            UI.addAgentLog('validator', `验证得分: ${validation.score}/100 ${validation.passed ? '✓' : '✗'}`);
        }

        // 如果验证不通过，生成改进建议
        if (validation.score < 60) {
            return {
                ...context,
                finalAnswer: this.improveAnswer(generatedAnswer, validation),
                needsImprovement: true
            };
        }

        return {
            ...context,
            finalAnswer: generatedAnswer,
            validationPassed: true
        };
    },

    /**
     * 分析问题类型
     */
    analyzeQuestionType(message) {
        const msg = message.toLowerCase();

        if (msg.includes('怎么') || msg.includes('如何') || msg.includes('怎样')) {
            return 'method'; // 方法类问题
        } else if (msg.includes('为什么') || msg.includes('原因') || msg.includes('为何')) {
            return 'why'; // 原理类问题
        } else if (msg.includes('是什么') || msg.includes('什么是') || msg.includes('解释')) {
            return 'what'; // 概念类问题
        } else if (msg.includes('公式') || msg.includes('计算') || msg.includes('求')) {
            return 'calculation'; // 计算类问题
        } else if (msg.includes('证明') || msg.includes('证')) {
            return 'proof'; // 证明类问题
        } else {
            return 'general'; // 一般性问题
        }
    },

    /**
     * 分析复杂度
     */
    analyzeComplexity(message, retrievedKnowledge) {
        let score = 0;

        // 检查问题长度
        if (message.length > 20) score += 1;

        // 检查是否包含多个问题
        if (message.includes('，') || message.includes('和') || message.includes('还有')) {
            score += 1;
        }

        // 检查是否有相关知识支持
        if (retrievedKnowledge.length > 0) {
            score += 1;
        }

        // 检查关键词
        const complexKeywords = ['证明', '推导', '综合', '分析', '比较'];
        for (const keyword of complexKeywords) {
            if (message.includes(keyword)) {
                score += 1;
                break;
            }
        }

        if (score <= 1) return 'simple';
        if (score <= 2) return 'medium';
        return 'complex';
    },

    /**
     * 设计教学策略
     */
    designStrategy(questionType, complexity, subject) {
        const strategies = {
            math: {
                method: '步骤分解+示例演示',
                what: '定义+性质+应用',
                why: '原理推导+直观理解',
                calculation: '公式应用+步骤详解',
                proof: '思路分析+证明过程'
            },
            chinese: {
                method: '方法介绍+示例分析',
                what: '概念解释+举例说明',
                why: '原因分析+情感体会',
                general: '理解+赏析+应用'
            },
            english: {
                method: '方法讲解+练习建议',
                what: '概念+例句+用法',
                general: '解释+举例+练习'
            },
            physics: {
                method: '原理分析+实际应用',
                what: '概念+公式+应用',
                why: '原理推导+实验验证',
                calculation: '公式选择+步骤详解',
                general: '概念理解+公式应用'
            }
        };

        return strategies[subject]?.[questionType] || strategies[subject]?.general || '直接讲解';
    },

    /**
     * 设计回答结构
     */
    designAnswerStructure(questionType, strategy) {
        const structures = {
            method: ['方法介绍', '具体步骤', '示例演示', '注意事项'],
            what: ['定义', '特点', '应用场景', '记忆技巧'],
            why: ['直接原因', '深层原理', '实际意义'],
            calculation: ['公式选择', '解题步骤', '计算过程', '答案'],
            proof: ['证明思路', '证明过程', '关键要点'],
            general: ['核心回答', '补充说明', '应用建议']
        };

        return structures[questionType] || structures.general;
    },

    /**
     * 构建增强提示词
     */
    buildEnhancedPrompt(subject, knowledgeContext, strategy, structure) {
        // 获取场景提示词
        const scenarioPrompt = Scenario.getCurrentPrompt();
        let prompt = scenarioPrompt + '\n\n' + (AI.SUBJECT_PROMPTS[subject] || AI.SUBJECT_PROMPTS.math);

        // 添加知识库上下文
        if (knowledgeContext) {
            prompt += `\n\n${knowledgeContext}`;
        }

        // 添加教学策略指导
        prompt += `\n\n【教学策略】
采用${strategy}的方式进行讲解。
回答结构：${structure.join(' → ')}`;

        // 添加准确性要求
        prompt += `\n\n【准确性要求】
- 必须基于上述知识库内容回答
- 如知识库中没有相关内容，请明确说明
- 不要编造不确定的信息`;

        return prompt;
    },

    /**
     * 验证答案质量
     */
    validateAnswer(answer, context) {
        let score = 100;
        let issues = [];

        // 长度检查
        if (answer.length < 10) {
            score -= 20;
            issues.push('回答过短');
        }
        if (answer.length > 150) {
            score -= 10;
            issues.push('回答过长');
        }

        // 内容检查
        if (answer.includes('不确定') || answer.includes('可能')) {
            score -= 15;
            issues.push('答案不确定');
        }

        // 复杂度检查
        if (context.complexity === 'complex' && answer.length < 30) {
            score -= 20;
            issues.push('复杂问题回答不够详细');
        }

        // 知识库使用检查
        if (context.hasKnowledge && !this.usesKnowledgeBase(answer)) {
            score -= 10;
            issues.push('未充分利用知识库');
        }

        return {
            score: Math.max(0, score),
            passed: score >= 60,
            issues: issues
        };
    },

    /**
     * 检查是否使用了知识库内容
     */
    usesKnowledgeBase(answer) {
        // 简单检查：答案是否包含具体的内容元素
        return answer.length > 20 && (answer.includes('：') || answer.includes('-') || answer.includes('。'));
    },

    /**
     * 改进答案
     */
    improveAnswer(answer, validation) {
        // 简单的改进策略
        if (validation.issues.includes('回答过短')) {
            return answer + ' 如需更详细的解释，请继续提问。';
        }
        if (validation.issues.includes('答案不确定')) {
            return answer + ' （建议参考教材或咨询老师确认）';
        }
        return answer;
    },

    /**
     * 设置当前活跃Agent
     */
    setActiveAgent(agentId, onProgress) {
        // 重置所有Agent状态
        if (typeof UI !== 'undefined') {
            UI.resetAllAgents();
        }

        this.activeAgent = agentId;

        // 更新UI状态
        if (typeof UI !== 'undefined') {
            UI.updateAgentCard(agentId, 'active', '工作中');
            const agentInfo = this.getAgentInfo(agentId);
            UI.addAgentLog(agentId, '开始处理...');
        }

        if (onProgress) {
            onProgress({
                agent: agentId,
                status: 'active'
            });
        }
    },

    /**
     * 添加Agent历史记录
     */
    addAgentHistory(agentId, data) {
        this.agentHistory.push({
            agent: agentId,
            timestamp: Date.now(),
            ...data
        });
    },

    /**
     * 获取Agent信息
     */
    getAgentInfo(agentId) {
        return this.AGENTS[agentId] || null;
    },

    /**
     * 获取Agent历史
     */
    getAgentHistory() {
        return this.agentHistory;
    },

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
