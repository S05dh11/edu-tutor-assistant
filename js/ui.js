/**
 * UI交互模块
 * 负责页面UI的更新和事件处理
 */

const UI = {
    // DOM元素缓存
    elements: {},

    /**
     * 初始化UI
     */
    init() {
        // 缓存DOM元素
        this.cacheElements();

        // 绑定事件
        this.bindEvents();

        // 初始化学科按钮
        this.initSubjectButtons();

        // 初始化快捷问题
        this.updateQuickQuestions();

        // 初始化密钥配置表单
        Config.initForm();
    },

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // 状态显示
            connectionStatus: document.getElementById('connection-status'),
            avatarState: document.getElementById('avatar-state'),

            // 按钮
            connectBtn: document.getElementById('connect-btn'),
            disconnectBtn: document.getElementById('disconnect-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            diagnoseBtn: document.getElementById('diagnose-btn'),
            clearBtn: document.getElementById('clear-btn'),
            sendBtn: document.getElementById('send-btn'),

            // 输入框
            chatInput: document.getElementById('chat-input'),

            // 对话区域
            chatMessages: document.getElementById('chat-messages'),

            // 快捷问题
            quickButtons: document.getElementById('quick-buttons'),

            // 学科按钮
            subjectBtns: document.querySelectorAll('.subject-btn'),

            // 弹窗
            settingsModal: document.getElementById('settings-modal'),
            modalClose: document.getElementById('modal-close'),
            saveKeysBtn: document.getElementById('save-keys-btn'),
            useTestKeysBtn: document.getElementById('use-test-keys-btn'),

            // 加载遮罩
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            loadingProgress: document.getElementById('loading-progress'),

            // 密钥输入
            appId: document.getElementById('app-id'),
            appSecret: document.getElementById('app-secret'),
            apiKey: document.getElementById('api-key'),

            // 字幕相关
            subtitleDisplay: document.getElementById('subtitle-display'),
            subtitleText: document.getElementById('subtitle-text'),
            subtitleProgress: document.getElementById('subtitle-progress'),

            // 数字人容器
            avatarContainer: document.getElementById('avatar-container')
        };
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        const el = this.elements;

        // 连接按钮
        el.connectBtn.addEventListener('click', () => {
            this.handleConnect();
        });

        // 断开按钮
        el.disconnectBtn.addEventListener('click', () => {
            Avatar.disconnect();
        });

        // 设置按钮
        el.settingsBtn.addEventListener('click', () => {
            this.showSettingsModal();
        });

        // 诊断按钮
        el.diagnoseBtn.addEventListener('click', () => {
            this.handleDiagnose();
        });

        // 清空记录按钮
        el.clearBtn.addEventListener('click', () => {
            this.clearMessages();
        });

        // 发送按钮
        el.sendBtn.addEventListener('click', () => {
            this.handleSendMessage();
        });

        // 输入框回车发送
        el.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // 弹窗关闭
        el.modalClose.addEventListener('click', () => {
            this.hideSettingsModal();
        });

        // 点击弹窗外部关闭
        el.settingsModal.addEventListener('click', (e) => {
            if (e.target === el.settingsModal) {
                this.hideSettingsModal();
            }
        });

        // 保存密钥
        el.saveKeysBtn.addEventListener('click', () => {
            this.handleSaveKeys();
        });

        // 使用测试密钥
        el.useTestKeysBtn.addEventListener('click', () => {
            this.handleUseTestKeys();
        });
    },

    /**
     * 初始化学科按钮
     */
    initSubjectButtons() {
        this.elements.subjectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有active类
                this.elements.subjectBtns.forEach(b => b.classList.remove('active'));
                // 添加active类到当前按钮
                btn.classList.add('active');
                // 切换学科
                const subject = btn.dataset.subject;
                AI.setSubject(subject);
                // 更新快捷问题
                this.updateQuickQuestions();
            });
        });
    },

    /**
     * 更新快捷问题按钮
     */
    updateQuickQuestions() {
        const questions = AI.getQuickQuestions();
        this.elements.quickButtons.innerHTML = questions.map(q =>
            `<button class="quick-btn">${q}</button>`
        ).join('');

        // 绑定快捷问题点击事件
        this.elements.quickButtons.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.chatInput.value = btn.textContent;
                this.handleSendMessage();
            });
        });

        // 绑定测试按钮事件
        ['test-1', 'test-2', 'test-3', 'test-4'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    const text = btn.getAttribute('data-text');
                    if (Avatar.isConnected()) {
                        console.log('测试语音:', text);
                        Avatar.speak(text, true, true);
                    } else {
                        this.showError('请先连接AI老师');
                    }
                });
            }
        });
    },

    /**
     * 处理连接
     */
    async handleConnect() {
        const config = Config.getAll();

        // 检查配置是否完整
        if (!config.appId || !config.appSecret || !config.apiKey) {
            this.showError('请先配置密钥（点击"密钥配置"按钮）');
            return;
        }

        // 显示加载动画
        this.showLoading('正在连接AI老师...');

        // 连接数字人
        const success = await Avatar.connect(config, (progress) => {
            this.updateLoadingProgress(progress);
        });

        if (success) {
            // 连接成功后添加欢迎消息
            const subjectInfo = AI.getSubjectInfo(AI.getCurrentSubject());
            const welcomeText = `你好！我是${subjectInfo.name}，很高兴为你辅导学习！`;
            this.addMessage('assistant', welcomeText);

            // 延迟让数字人说话，确保SDK完全初始化
            setTimeout(() => {
                if (Avatar.isConnected()) {
                    console.log('播放欢迎语');
                    // 直接调用speak，让SDK自动处理状态
                    Avatar.speak(welcomeText, true, true);
                } else {
                    console.warn('数字人已断开，无法播放欢迎语');
                }
            }, 2000);
        }
    },

    /**
     * 处理发送消息
     */
    async handleSendMessage() {
        const input = this.elements.chatInput;
        const message = input.value.trim();

        if (!message) {
            return;
        }

        // 检查连接状态
        if (!Avatar.isConnected()) {
            this.showError('请先连接AI老师');
            return;
        }

        // 清空输入框
        input.value = '';

        // 添加用户消息
        this.addMessage('user', message);

        // 禁用发送按钮
        this.setSendButtonDisabled(true);

        // 不需要切换状态，保持当前状态
        // 获取AI回复
        const config = Config.getAll();
        let assistantMessage = '';
        let messageElement = null;

        // 添加助手消息占位
        messageElement = this.addMessage('assistant', '');

        await AI.chat(
            message,
            config.apiKey,
            // onMessage - 流式接收消息，只更新UI
            (chunk) => {
                assistantMessage += chunk;
                this.updateMessage(messageElement, assistantMessage);
                // 不在这里调用speak，等待完整回复后再说
            },
            // onComplete - 对话完成
            (fullMessage) => {
                assistantMessage = fullMessage;
                this.updateMessage(messageElement, assistantMessage);

                // 等AI完整回复后，让数字人说一遍
                if (Avatar.isConnected() && assistantMessage) {
                    console.log('AI回复完成，开始播放语音:', assistantMessage);

                    // 直接调用speak，不需要先切换idle状态
                    // SDK会自动处理状态切换
                    setTimeout(() => {
                        console.log('开始说话，文本长度:', assistantMessage.length);
                        Avatar.speak(assistantMessage, true, true);
                    }, 300);
                }

                this.setSendButtonDisabled(false);
            },
            // onError - 错误处理
            (error) => {
                this.updateMessage(messageElement, '抱歉，我遇到了一些问题，请稍后再试。');
                console.error('AI对话错误:', error);
                Avatar.idle();
                this.setSendButtonDisabled(false);
            }
        );
    },

    /**
     * 处理保存密钥
     */
    handleSaveKeys() {
        const appId = this.elements.appId.value.trim();
        const appSecret = this.elements.appSecret.value.trim();
        const apiKey = this.elements.apiKey.value.trim();

        if (!appId || !appSecret || !apiKey) {
            this.showError('请填写完整的密钥信息');
            return;
        }

        Config.saveAll({ appId, appSecret, apiKey });
        this.hideSettingsModal();
        this.showSuccess('密钥配置已保存');
    },

    /**
     * 处理使用测试密钥
     */
    handleUseTestKeys() {
        const testKeys = Config.fillTestKeys();
        this.elements.appId.value = testKeys.appId || '';
        this.elements.appSecret.value = testKeys.appSecret || '';
        this.elements.apiKey.value = testKeys.apiKey || '';

        if (!testKeys.appId && !testKeys.appSecret && !testKeys.apiKey) {
            this.showError('测试密钥未配置，请在 Config.TEST_KEYS 中设置您的测试密钥');
        } else {
            this.showSuccess('已填充测试密钥，请点击"保存配置"保存');
        }
    },

    /**
     * 处理诊断
     */
    async handleDiagnose() {
        console.clear();
        console.log('开始诊断...');
        await Avatar.diagnose();
        alert('诊断完成，请查看浏览器控制台（F12）的详细日志');
    },

    /**
     * 添加消息到对话区域
     */
    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(content);

        messageDiv.appendChild(contentDiv);
        this.elements.chatMessages.appendChild(messageDiv);

        // 滚动到底部
        this.scrollToBottom();

        return messageDiv;
    },

    /**
     * 更新消息内容
     */
    updateMessage(element, content) {
        const contentDiv = element.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.formatMessage(content);
            this.scrollToBottom();
        }
    },

    /**
     * 格式化消息内容
     */
    formatMessage(content) {
        // 简单的换行处理
        return content.replace(/\n/g, '<br>');
    },

    /**
     * 清空消息记录
     */
    clearMessages() {
        if (confirm('确定要清空所有对话记录吗？')) {
            this.elements.chatMessages.innerHTML = '';
        }
    },

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    },

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(status) {
        const el = this.elements.connectionStatus;
        el.className = 'status-value';

        switch (status) {
            case 'connected':
                el.classList.add('connected');
                el.textContent = '已连接';
                this.elements.connectBtn.disabled = true;
                this.elements.disconnectBtn.disabled = false;
                break;
            case 'connecting':
                el.classList.add('connecting');
                el.textContent = '连接中...';
                this.elements.connectBtn.disabled = true;
                this.elements.disconnectBtn.disabled = true;
                break;
            case 'disconnected':
                el.classList.add('disconnected');
                el.textContent = '未连接';
                this.elements.connectBtn.disabled = false;
                this.elements.disconnectBtn.disabled = true;
                break;
        }
    },

    /**
     * 更新数字人状态显示
     */
    updateAvatarState(state) {
        const stateMap = {
            'idle': '待机',
            'listen': '倾听',
            'think': '思考',
            'speak': '说话',
            'interactive_idle': '互动待机'
        };
        this.elements.avatarState.textContent = stateMap[state] || state;
    },

    /**
     * 重置数字人容器
     */
    resetAvatarContainer() {
        this.elements.avatarContainer.innerHTML = `
            <div class="avatar-placeholder">
                <div class="placeholder-icon">👨‍🏫</div>
                <p class="placeholder-text">请配置密钥并连接AI老师</p>
            </div>
        `;
    },

    /**
     * 设置发送按钮状态
     */
    setSendButtonDisabled(disabled) {
        this.elements.sendBtn.disabled = disabled;
    },

    /**
     * 显示设置弹窗
     */
    showSettingsModal() {
        this.elements.settingsModal.classList.add('show');
    },

    /**
     * 隐藏设置弹窗
     */
    hideSettingsModal() {
        this.elements.settingsModal.classList.remove('show');
    },

    /**
     * 显示加载动画
     */
    showLoading(text) {
        this.elements.loadingText.textContent = text;
        this.elements.loadingProgress.textContent = '0%';
        this.elements.loadingOverlay.classList.add('show');
    },

    /**
     * 更新加载进度
     */
    updateLoadingProgress(progress) {
        this.elements.loadingProgress.textContent = `${progress}%`;
    },

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('show');
    },

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        // 简单使用alert，实际项目可以使用更优雅的提示
        alert(message);
    },

    /**
     * 显示错误消息
     */
    showError(message) {
        alert(message);
    },

    /**
     * 处理SDK错误
     */
    handleSDKError(message) {
        const errorMap = {
            10001: '容器不存在',
            10002: 'Socket连接错误',
            10003: '会话初始化失败',
            10004: '会话关闭失败',
            10005: '房间限流：请等待几秒后重试，或刷新页面',
            20001: '视频处理错误',
            40001: '音频解码错误',
            40006: 'TTSA服务异常',
            50001: '网络离线',
            50004: '网络断开'
        };

        const errorText = errorMap[message.code] || message.message || '未知错误';
        console.error(`SDK错误 [${message.code}]:`, errorText);

        // 根据错误类型决定是否显示给用户
        if (message.code === 10005) {
            this.showError(`房间限流错误：\n\n请按以下步骤操作：\n1. 点击"断开连接"按钮\n2. 等待3-5秒\n3. 刷新页面\n4. 重新连接`);
        } else if (message.code >= 50001) {
            this.showError(`网络错误: ${errorText}`);
        } else if (message.code >= 10001 && message.code <= 10004) {
            this.showError(`连接错误: ${errorText}`);
        }
    },

    /**
     * 显示字幕
     */
    showSubtitle(text, currentIndex, total) {
        if (!this.elements.subtitleDisplay) return;

        // 显示字幕容器
        this.elements.subtitleDisplay.style.display = 'block';

        // 更新字幕文本
        this.elements.subtitleText.textContent = text;

        // 更新进度点
        let dots = '';
        for (let i = 0; i < total; i++) {
            dots += `<span class="subtitle-dot ${i === currentIndex ? 'active' : ''}"></span>`;
        }
        this.elements.subtitleProgress.innerHTML = dots;
    },

    /**
     * 隐藏字幕
     */
    hideSubtitle() {
        if (!this.elements.subtitleDisplay) return;

        this.elements.subtitleDisplay.style.display = 'none';
        this.elements.subtitleText.textContent = '';
        this.elements.subtitleProgress.innerHTML = '';
    }
};
