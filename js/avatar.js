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

    // 数字转中文映射
    numberToChinese: {
        '0': '零', '1': '一', '2': '二', '3': '三', '4': '四',
        '5': '五', '6': '六', '7': '七', '8': '八', '9': '九',
        '10': '十', '11': '十一', '12': '十二', '13': '十三', '14': '十四',
        '15': '十五', '16': '十六', '17': '十七', '18': '十八', '19': '十九',
        '20': '二十', '30': '三十', '40': '四十', '50': '五十',
        '60': '六十', '70': '七十', '80': '八十', '90': '九十',
        '100': '一百', '1000': '一千', '10000': '一万'
    },

    // 字母转中文拼音映射
    letterToChinese: {
        'a': '阿', 'b': '波', 'c': '呲', 'd': '嘚', 'e': '鹅',
        'f': '佛', 'g': '哥', 'h': '喝', 'i': '衣', 'j': '机',
        'k': '科', 'l': '勒', 'm': '摸', 'n': '讷', 'o': '喔',
        'p': '坡', 'q': '欺', 'r': '日', 's': '思', 't': '特',
        'u': '乌', 'v': '维', 'w': '乌', 'x': '西', 'y': '衣',
        'z': '资',
        'A': '阿', 'B': '波', 'C': '呲', 'D': '嘚', 'E': '鹅',
        'F': '佛', 'G': '哥', 'H': '喝', 'I': '衣', 'J': '机',
        'K': '科', 'L': '勒', 'M': '摸', 'N': '讷', 'O': '喔',
        'P': '坡', 'Q': '欺', 'R': '日', 'S': '思', 'T': '特',
        'U': '乌', 'V': '维', 'W': '乌', 'X': '西', 'Y': '衣',
        'Z': '资'
    },

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
                    console.log('Voice State:', status, '队列状态:', this.isPlayingQueue, '队列数:', this.speakQueue.length);

                    // 语音结束 - 播放下一段（注意：SDK传入的是 'end' 不是 'voice_end'）
                    if (status === 'end') {
                        console.log('✅ 收到语音结束事件，准备播放下一段');
                        if (this.isPlayingQueue && this.speakQueue.length > 0) {
                            // 延迟再播放下一段，确保完全播放完成
                            setTimeout(() => {
                                console.log('⏭️ 调用playNextInQueue...');
                                this.playNextInQueue();
                            }, 1000); // 增加延迟到1000ms
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

        // 先预处理文本，将数字和字母转换为中文
        text = this.preprocessText(text);

        if (!text || text.trim() === '') {
            console.warn('预处理后文本为空，无法说话');
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

        // 按句子边界分段，避免在句子中间断开
        const sentences = this.splitIntoSentences(text);

        let currentChunk = '';
        sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length <= MAX_LENGTH) {
                // 可以合并到当前段
                currentChunk += sentence;
            } else {
                // 需要新开一段
                if (currentChunk) {
                    chunks.push({ text: currentChunk, index: chunks.length });
                }

                if (sentence.length > MAX_LENGTH) {
                    // 单个句子太长，强制分段
                    for (let i = 0; i < sentence.length; i += MAX_LENGTH) {
                        chunks.push({
                            text: sentence.substring(i, i + MAX_LENGTH),
                            index: chunks.length
                        });
                    }
                    currentChunk = '';
                } else {
                    currentChunk = sentence;
                }
            }
        });

        // 添加最后一段
        if (currentChunk) {
            chunks.push({ text: currentChunk, index: chunks.length });
        }

        console.log(`📝 加入队列: ${chunks.length}段 (原文${text.length}字, 分成${sentences.length}句)`);

        // 加入队列
        this.speakQueue.push({
            chunks: chunks,
            totalChunks: chunks.length,
            currentChunk: 0
        });

        // 设置队列播放状态
        this.isPlayingQueue = true;
        console.log('✅ isPlayingQueue 已设置为 true，队列数:', this.speakQueue.length);

        // 直接开始播放
        this.playNextInQueue();
    },

    /**
     * 将文本按句子分割
     */
    splitIntoSentences(text) {
        // 按标点符号分割，但保留标点
        const sentences = [];
        let current = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            current += char;

            // 句子结束标记
            if (['。', '！', '？', '.', '!', '?', '\n'].includes(char)) {
                sentences.push(current);
                current = '';
            } else if (['，', '；', ',', ';', '：', ':'].includes(char)) {
                // 逗号等也可以作为分段点（如果句子太长）
                // 这里先不分割，让后续逻辑处理
            }
        }

        // 处理最后一段
        if (current) {
            sentences.push(current);
        }

        // 如果没有分割出任何句子，返回原文
        if (sentences.length === 0) {
            return [text];
        }

        return sentences;
    },

    /**
     * 播放下一段
     */
    async playNextInQueue() {
        console.log('═══════════════════════════════════');
        console.log('📋 playNextInQueue被调用');
        console.log('队列数量:', this.speakQueue.length);
        console.log('isPlayingQueue:', this.isPlayingQueue);

        // 找到第一个未完成的队列
        let queueIndex = -1;
        for (let i = 0; i < this.speakQueue.length; i++) {
            const queue = this.speakQueue[i];
            console.log(`队列${i}: currentChunk=${queue.currentChunk}/${queue.totalChunks}`);

            if (queue.currentChunk < queue.totalChunks) {
                queueIndex = i;
                break;
            }
        }

        if (queueIndex === -1) {
            console.log('✅ 所有队列播放完成');
            this.isPlayingQueue = false;
            this.speakQueue = [];
            UI.hideSubtitle();
            // 播放完成后切换到listen状态，准备下一次对话
            setTimeout(() => {
                if (this.sdk && this.currentState !== 'listen') {
                    this.sdk.listen();
                }
            }, 500);
            console.log('═══════════════════════════════════');
            return;
        }

        const queue = this.speakQueue[queueIndex];
        const chunk = queue.chunks[queue.currentChunk];

        console.log(`🎵 播放第${queue.currentChunk + 1}/${queue.totalChunks}段`);
        console.log(`内容: "${chunk.text}"`);

        // 显示字幕
        UI.showSubtitle(chunk.text, queue.currentChunk, queue.totalChunks);

        // 如果不是第一段，先切换到listen状态并等待更长时间
        if (queue.currentChunk > 0) {
            console.log('切换到listen状态准备播放下一段');
            this.sdk.listen();
            await this.sleep(600); // 等待状态切换
        }

        // 播放当前段
        await this.doSpeak(chunk.text, true, true);

        // 更新计数
        queue.currentChunk++;
        console.log(`✅ 计数已更新: ${queue.currentChunk}/${queue.totalChunks}`);
        console.log('═══════════════════════════════════');

        // 注意：不要在这里调用playNextInQueue()
        // 下一段会在SDK的onVoiceStateChange回调中触发，或超时机制触发
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
                isEnd: isEnd,
                currentState: this.currentState
            });

            // 在speak之前先切换到listen状态，确保上一次讲话已结束
            if (this.sdk && this.currentState !== 'listen') {
                console.log('切换到listen状态准备说话，当前状态:', this.currentState);
                this.sdk.listen();
                // 等待状态切换完成，增加到500ms
                await this.sleep(500);
                console.log('等待完成，准备speak');
            }

            // 调用speak方法
            this.sdk.speak(text, isStart, isEnd);
            this.currentState = 'speak';
            console.log('✅ speak已调用');

            // 如果是队列播放，设置超时检查以防回调没触发
            if (this.isPlayingQueue && this.speakQueue.length > 0) {
                const queueIndex = this.speakQueue.findIndex(q => q.currentChunk < q.totalChunks);
                if (queueIndex >= 0) {
                    const queue = this.speakQueue[queueIndex];
                    const isLastChunk = queue.currentChunk >= queue.totalChunks - 1;

                    if (!isLastChunk) {
                        // 非最后一段，设置超时保险
                        const estimatedTime = Math.max(text.length * 150, 3000); // 估计播放时间
                        console.log(`⏱️ 设置超时检查: ${estimatedTime}ms (队列${queueIndex}, 第${queue.currentChunk + 1}段)`);

                        const currentChunkIndex = queue.currentChunk;
                        setTimeout(() => {
                            // 检查是否还在播放队列，且当前段还没播放完成
                            if (this.isPlayingQueue && this.speakQueue.length > queueIndex) {
                                const currentQueue = this.speakQueue[queueIndex];
                                if (currentQueue && currentQueue.currentChunk <= currentChunkIndex) {
                                    console.warn('⚠️ 检测到播放可能卡住，强制播放下一段');
                                    this.playNextInQueue();
                                }
                            }
                        }, estimatedTime + 2000); // 额外2秒缓冲
                    } else {
                        console.log('这是最后一段，不设置超时检查');
                    }
                }
            }
        } catch (error) {
            console.error('❌ speak调用失败:', error);
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
     * 文本预处理：将数字和字母转换为中文发音
     */
    preprocessText(text) {
        if (!text) return '';

        let processed = text;

        // 处理数字：将独立的数字转换为中文
        // 策略：匹配前后都是非数字字符的数字，或开头/结尾的数字
        // 不转换：数学表达式中的数字（如 2x, x^2, =4 等）
        processed = processed.replace(/(?<![a-zA-Z0-9=+\-*/^])\d+(?![a-zA-Z0-9=+\-*/^])/g, (match) => {
            return this.convertNumberToChinese(match);
        });

        // 处理单个字母：只转换独立的单个字母（不处理英文单词）
        // 独立字母的定义：前后都是非字母字符，或开头/结尾
        processed = processed.replace(/(?<![a-zA-Z])[a-zA-Z](?![a-zA-Z])/g, (match) => {
            return this.letterToChinese[match] || match;
        });

        // 特殊处理：常见数学变量不转换
        const mathVars = ['x', 'y', 'z', 'a', 'b', 'c', 'n', 'm', 'k'];
        mathVars.forEach(v => {
            // 将中文变量名还原为英文（如：西=2中的"西"可能是x）
            // 这里我们需要更智能的处理
        });

        console.log('文本预处理:', {
            原文: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            处理后: processed.substring(0, 50) + (processed.length > 50 ? '...' : '')
        });

        return processed;
    },

    /**
     * 将数字转换为中文
     */
    convertNumberToChinese(numStr) {
        const num = parseInt(numStr);

        // 如果在映射表中直接返回
        if (this.numberToChinese[numStr]) {
            return this.numberToChinese[numStr];
        }

        // 处理更大的数字
        if (num < 10) {
            return this.numberToChinese[numStr];
        } else if (num < 20) {
            return '十' + (num > 10 ? this.numberToChinese[String(num - 10)] : '');
        } else if (num < 100) {
            const tens = Math.floor(num / 10);
            const units = num % 10;
            return this.numberToChinese[String(tens * 10)] + (units > 0 ? this.numberToChinese[String(units)] : '');
        } else if (num < 1000) {
            const hundreds = Math.floor(num / 100);
            const remainder = num % 100;
            let result = this.numberToChinese[String(hundreds)] + '百';
            if (remainder > 0) {
                result += this.convertNumberToChinese(String(remainder));
            }
            return result;
        } else if (num < 10000) {
            const thousands = Math.floor(num / 1000);
            const remainder = num % 1000;
            let result = this.convertNumberToChinese(String(thousands)) + '千';
            if (remainder > 0) {
                result += this.convertNumberToChinese(String(remainder));
            }
            return result;
        }

        // 对于非常大的数字，返回原文
        return numStr;
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
