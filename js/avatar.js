/**
 * 数字人控制模块
 * 负责魔珐星云SDK的初始化、连接、状态管理和语音播放
 */

const Avatar = {
    // SDK 实例
    sdk: null,

    // 连接状态
    connected: false,
    connecting: false,

    // 当前状态
    currentState: 'idle',

    // 分段播放队列
    speakQueue: [],
    isPlayingQueue: false,

    // 服务地址
    GATEWAY_SERVER: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

    /**
     * 诊断检查
     */
    async diagnose() {
        console.log('========== 环境诊断 ==========');

        // 1. 检查浏览器支持
        console.log('浏览器信息:', navigator.userAgent);
        console.log('WebGL支持:', !!window.WebGLRenderingContext);

        // 2. 检查网络
        try {
            const response = await fetch('https://nebula-agent.xingyun3d.com', { method: 'HEAD' });
            console.log('网关连接: 成功', response.status);
        } catch (e) {
            console.error('网关连接: 失败', e.message);
        }

        // 3. 检查localStorage
        const config = Config.getAll();
        console.log('密钥配置:', {
            appId: config.appId ? '已设置' : '未设置',
            appSecret: config.appSecret ? '已设置' : '未设置',
            apiKey: config.apiKey ? '已设置' : '未设置'
        });

        // 4. 检查容器
        const container = document.getElementById('avatar-container');
        if (container) {
            console.log('容器尺寸:', {
                width: container.offsetWidth,
                height: container.offsetHeight
            });
        } else {
            console.error('容器未找到');
        }

        console.log('========== 诊断完成 ==========');
    },

    /**
     * 初始化SDK并连接
     */
    async connect(config, onProgress) {
        // 如果已连接，先断开
        if (this.connected || this.sdk) {
            console.log('检测到已有连接，先断开...');
            await this.disconnect();
            // 等待更长时间确保资源释放
            console.log('等待资源释放...');
            await this.sleep(3000);
        }

        if (this.connecting) {
            console.log('SDK正在连接中...');
            return;
        }

        // 检查配置
        if (!config.appId || !config.appSecret) {
            console.error('密钥配置不完整');
            UI.showError('密钥配置不完整，请检查配置');
            return false;
        }

        console.log('开始连接AI老师...');
        console.log('AppId:', config.appId);
        console.log('AppSecret:', config.appSecret ? '已设置(' + config.appSecret.length + '字符)' : '未设置');

        this.connecting = true;
        UI.updateConnectionStatus('connecting');

        try {
            // 先清空容器内容
            const container = document.querySelector('#avatar-container');
            if (container) {
                container.innerHTML = '<div id="xmov-avatar-wrapper" style="width:100%;height:100%;"></div>';
            }

            // 创建SDK实例
            this.sdk = new XmovAvatar({
                containerId: '#xmov-avatar-wrapper',
                appId: config.appId,
                appSecret: config.appSecret,
                gatewayServer: this.GATEWAY_SERVER,

                // 消息回调
                onMessage: (message) => {
                    console.log('SDK Message:', message);
                    this.handleMessage(message);
                },

                // 状态变化回调
                onStateChange: (state) => {
                    console.log('SDK State Change:', state);
                    this.currentState = state;
                    UI.updateAvatarState(state);
                },

                // 连接状态变化回调
                onStatusChange: (status) => {
                    console.log('SDK Status Change:', status, `(${this.getStatusName(status)})`);
                    this.handleStatusChange(status);
                },

                // 网络信息回调
                onNetworkInfo: (networkInfo) => {
                    console.log('Network Info:', networkInfo);
                },

                // 语音播放状态回调
                onVoiceStateChange: (status) => {
                    console.log('Voice State:', status);

                    // 语音结束 - 播放下一段（注意：SDK传入的是 'end' 不是 'voice_end'）
                    if (status === 'end') {
                        console.log('收到语音结束事件');
                        if (this.isPlayingQueue && this.speakQueue.length > 0) {
                            // 延迟一点再播放下一段
                            setTimeout(() => {
                                console.log('准备播放下一段...');
                                this.playNextInQueue();
                            }, 800);
                        } else {
                            console.log('队列为空或未在播放队列');
                        }
                    }

                    this.handleVoiceStateChange(status);
                },

                // Widget事件回调
                onWidgetEvent: (data) => {
                    // 详细记录widget事件
                    if (data.type && (data.type.includes('subtitle') || data.type.includes('ka') || data.type === 'voice_start' || data.type === 'voice_end')) {
                        console.log('Widget Event详情:', JSON.stringify(data));
                    } else {
                        console.log('Widget Event:', data);
                    }
                },

                // 关闭SDK日志避免控制台刷屏
                enableLogger: false
            });

            // 初始化SDK
            await this.sdk.init({
                onDownloadProgress: (progress) => {
                    console.log(`资源下载进度: ${progress}%`);
                    if (onProgress) {
                        onProgress(progress);
                    }
                }
            });

            console.log('SDK初始化完成，等待连接稳定...');
            // 等待连接稳定
            await this.sleep(3000);

            // 检查连接是否仍然有效
            if (!this.sdk || this.currentState === 'close') {
                throw new Error('SDK连接后立即断开，请检查：\n1. 魔珐星云应用是否选择了角色\n2. 应用状态是否为"已启用"\n3. 密钥是否正确');
            }

            this.connected = true;
            this.connecting = false;
            UI.updateConnectionStatus('connected');
            UI.hideLoading();

            console.log('SDK连接成功，当前状态:', this.currentState);

            // 检查数字人是否渲染
            await this.checkAvatarRendering();

            // 不自动切换状态，让SDK保持在默认状态
            console.log('连接成功，保持默认状态');

            return true;

        } catch (error) {
            console.error('SDK连接失败:', error);
            this.connected = false;
            this.connecting = false;
            UI.updateConnectionStatus('disconnected');
            UI.hideLoading();
            UI.showError('AI老师连接失败，请检查密钥配置');
            return false;
        }
    },

    /**
     * 断开连接
     */
    async disconnect() {
        console.log('开始断开连接...');

        if (this.sdk) {
            try {
                // 先停止说话
                this.sdk.listen();
                await this.sleep(500);

                // 销毁SDK
                this.sdk.destroy();
                console.log('SDK已销毁');
            } catch (error) {
                console.error('销毁SDK失败:', error);
            }
            this.sdk = null;
        }

        this.connected = false;
        this.connecting = false;
        this.currentState = 'idle';

        UI.updateConnectionStatus('disconnected');
        UI.updateAvatarState('--');
        UI.resetAvatarContainer();

        console.log('SDK已断开连接');
    },

    /**
     * 进入待机状态
     */
    idle() {
        if (!this.connected || !this.sdk) return;

        try {
            this.sdk.idle();
            this.currentState = 'idle';
        } catch (error) {
            console.error('切换待机状态失败:', error);
        }
    },

    /**
     * 进入倾听状态
     */
    listen() {
        if (!this.connected || !this.sdk) return;

        try {
            this.sdk.listen();
            this.currentState = 'listen';
        } catch (error) {
            console.error('切换倾听状态失败:', error);
        }
    },

    /**
     * 进入思考状态
     */
    think() {
        if (!this.connected || !this.sdk) return;

        try {
            this.sdk.think();
            this.currentState = 'think';
        } catch (error) {
            console.error('切换思考状态失败:', error);
        }
    },

    /**
     * 说话（支持分段播放长文本）
     * @param {string} text - 要说的文本
     * @param {boolean} isStart - 是否开始
     * @param {boolean} isEnd - 是否结束
     */
    async speak(text, isStart = true, isEnd = true) {
        if (!this.connected || !this.sdk) {
            console.warn('SDK未连接，无法说话');
            return;
        }

        if (!text || text.trim() === '') {
            console.warn('文本为空，无法说话');
            return;
        }

        // 文本长度限制（30字以内直接播放，超过则分段）
        const MAX_LENGTH = 30;

        if (text.length <= MAX_LENGTH) {
            // 短文本，直接播放
            console.log('播放短文本:', text.length, '字');
            await this.doSpeak(text, isStart, isEnd);
        } else {
            // 长文本，加入队列分段播放
            console.log(`文本较长(${text.length}字)，加入播放队列`);
            this.enqueueSpeak(text);
        }
    },

    /**
     * 将文本加入播放队列
     */
    enqueueSpeak(text) {
        const MAX_LENGTH = 30;
        const chunks = [];

        // 分段
        for (let i = 0; i < text.length; i += MAX_LENGTH) {
            chunks.push({
                text: text.substring(i, i + MAX_LENGTH),
                index: i
            });
        }

        console.log(`加入队列: ${chunks.length}段`);

        // 加入队列
        this.speakQueue.push({
            chunks: chunks,
            totalChunks: chunks.length,
            currentChunk: 0
        });

        // 如果没有在播放，开始播放
        if (!this.isPlayingQueue) {
            this.playNextInQueue();
        }
    },

    /**
     * 播放下一段
     */
    async playNextInQueue() {
        console.log('playNextInQueue被调用, 队列数量:', this.speakQueue.length);

        // 找到第一个未完成的队列
        let queueIndex = -1;
        for (let i = 0; i < this.speakQueue.length; i++) {
            const queue = this.speakQueue[i];
            console.log(`队列${i}: currentChunk=${queue.currentChunk}, totalChunks=${queue.totalChunks}`);

            if (queue.currentChunk < queue.totalChunks) {
                queueIndex = i;
                break;
            }
        }

        if (queueIndex === -1) {
            console.log('所有队列播放完成');
            this.isPlayingQueue = false;
            this.speakQueue = [];
            UI.hideSubtitle();
            return;
        }

        const queue = this.speakQueue[queueIndex];
        const chunk = queue.chunks[queue.currentChunk];

        console.log(`播放第${queue.currentChunk + 1}/${queue.totalChunks}段: "${chunk.text}"`);

        // 显示字幕
        UI.showSubtitle(chunk.text, queue.currentChunk, queue.totalChunks);

        // 如果不是第一段，先切换到listen状态
        if (queue.currentChunk > 0) {
            console.log('切换到listen状态准备播放下一段');
            this.sdk.listen();
            await this.sleep(300);
        }

        // 播放当前段
        await this.doSpeak(chunk.text, true, true);

        // 更新计数
        queue.currentChunk++;
        console.log('计数已更新:', queue.currentChunk);

        // 注意：不要在这里调用playNextInQueue()
        // 下一段会在SDK的onVoiceStateChange回调中触发
    },

    /**
     * 实际执行说话
     */
    async doSpeak(text, isStart, isEnd) {
        try {
            console.log('调用speak:', {
                text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
                textLength: text.length,
                isStart: isStart,
                isEnd: isEnd
            });

            // 在speak之前先切换到listen状态，确保上一次讲话已结束
            if (this.sdk && this.currentState !== 'listen') {
                console.log('切换到listen状态准备说话');
                this.sdk.listen();
                // 等待状态切换完成
                await this.sleep(300);
            }

            // 调用speak方法
            this.sdk.speak(text, isStart, isEnd);
            this.currentState = 'speak';
        } catch (error) {
            console.error('speak调用失败:', error);
        }
    },

    /**
     * 进入在线模式
     */
    onlineMode() {
        if (!this.connected || !this.sdk) return;

        try {
            this.sdk.onlineMode();
        } catch (error) {
            console.error('切换在线模式失败:', error);
        }
    },

    /**
     * 进入离线模式
     */
    offlineMode() {
        if (!this.connected || !this.sdk) return;

        try {
            this.sdk.offlineMode();
        } catch (error) {
            console.error('切换离线模式失败:', error);
        }
    },

    /**
     * 设置音量
     * @param {number} volume - 音量值 0-1
     */
    setVolume(volume) {
        if (!this.connected || !this.sdk) return;

        try {
            this.sdk.setVolume(volume);
        } catch (error) {
            console.error('设置音量失败:', error);
        }
    },

    /**
     * 处理SDK消息
     */
    handleMessage(message) {
        console.log('收到SDK消息:', message);

        if (message.code !== 0) {
            console.error('SDK错误:', message);
            console.error('错误码:', message.code);
            console.error('错误信息:', message.message);

            // 显示详细错误信息
            let errorMsg = `SDK错误 [${message.code}]: ${message.message}`;
            UI.handleSDKError(message);
        }
    },

    /**
     * 处理连接状态变化
     */
    handleStatusChange(status) {
        switch (status) {
            case 0: // online
                console.log('SDK状态: 在线');
                break;
            case 1: // offline
                console.log('SDK状态: 离线');
                break;
            case 2: // network_on
                console.log('SDK状态: 网络恢复');
                break;
            case 3: // network_off
                console.log('SDK状态: 网络断开');
                UI.showError('网络连接已断开');
                break;
            case 4: // close
                console.log('SDK状态: 已关闭');
                // 只有在非主动断开时才更新UI
                if (this.connected && !this.connecting) {
                    console.warn('SDK意外断开连接');
                    this.connected = false;
                    UI.updateConnectionStatus('disconnected');
                }
                break;
        }
    },

    /**
     * 获取状态名称
     */
    getStatusName(status) {
        const statusMap = {
            0: 'online',
            1: 'offline',
            2: 'network_on',
            3: 'network_off',
            4: 'close'
        };
        return statusMap[status] || status;
    },

    /**
     * 处理语音播放状态变化
     */
    handleVoiceStateChange(status) {
        console.log('语音状态变化:', status);

        if (status === 'voice_start') {
            console.log('语音开始播放');
        } else if (status === 'voice_end') {
            console.log('语音播放结束');
            // 语音结束后可以切换到其他状态
            // 这里可以添加后续处理逻辑
        }
    },

    /**
     * 检查是否已连接
     */
    isConnected() {
        return this.connected;
    },

    /**
     * 获取当前状态
     */
    getCurrentState() {
        return this.currentState;
    },

    /**
     * 延时辅助函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 检查数字人渲染情况
     */
    async checkAvatarRendering() {
        console.log('========== 数字人渲染检查 ==========');

        const wrapper = document.querySelector('#xmov-avatar-wrapper');
        if (!wrapper) {
            console.error('找不到数字人容器 (#xmov-avatar-wrapper)');
            return;
        }

        console.log('容器信息:', {
            offsetWidth: wrapper.offsetWidth,
            offsetHeight: wrapper.offsetHeight,
            clientWidth: wrapper.clientWidth,
            clientHeight: wrapper.clientHeight
        });

        // 检查容器内的元素
        const children = wrapper.children;
        console.log('容器内元素数量:', children.length);

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            console.log(`元素 ${i}:`, {
                tagName: child.tagName,
                id: child.id,
                className: child.className,
                width: child.offsetWidth,
                height: child.offsetHeight
            });

            // 检查是否有canvas
            if (child.tagName === 'CANVAS') {
                console.log('发现Canvas元素!', {
                    width: child.width,
                    height: child.height,
                    getContext: !!child.getContext('webgl') || !!child.getContext('2d')
                });
            }

            // 检查是否有video
            if (child.tagName === 'VIDEO') {
                console.log('发现Video元素!', {
                    src: child.src,
                    readyState: child.readyState,
                    videoWidth: child.videoWidth,
                    videoHeight: child.videoHeight
                });
            }
        }

        // 如果没有找到canvas或video，说明SDK可能没有正确渲染
        const hasCanvas = Array.from(children).some(c => c.tagName === 'CANVAS');
        const hasVideo = Array.from(children).some(c => c.tagName === 'VIDEO');

        if (!hasCanvas && !hasVideo) {
            console.warn('⚠️ 未检测到Canvas或Video元素，数字人可能没有正确渲染');
            console.warn('可能的原因：');
            console.warn('1. SDK资源下载未完成');
            console.warn('2. WebGL初始化失败');
            console.warn('3. 容器尺寸不正确');
            console.warn('4. 浏览器兼容性问题');
        } else {
            console.log('✅ 检测到渲染元素');
        }

        console.log('========== 检查完成 ==========');
    }
};
