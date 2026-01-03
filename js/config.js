/**
 * 配置管理模块
 * 负责密钥的存储、读取和验证
 */

const Config = {
    // localStorage键名
    KEYS: {
        APP_ID: 'edu_tutor_app_id',
        APP_SECRET: 'edu_tutor_app_secret',
        API_KEY: 'edu_tutor_ms_api_key'
    },

    // 测试密钥 - 用户可以在这里配置自己的测试密钥
    TEST_KEYS: {
        APP_ID: '',
        APP_SECRET: '',
        API_KEY: ''
    },

    /**
     * 获取所有配置
     */
    getAll() {
        return {
            appId: localStorage.getItem(this.KEYS.APP_ID) || '',
            appSecret: localStorage.getItem(this.KEYS.APP_SECRET) || '',
            apiKey: localStorage.getItem(this.KEYS.API_KEY) || ''
        };
    },

    /**
     * 保存所有配置
     */
    saveAll(config) {
        if (config.appId) {
            localStorage.setItem(this.KEYS.APP_ID, config.appId);
        }
        if (config.appSecret) {
            localStorage.setItem(this.KEYS.APP_SECRET, config.appSecret);
        }
        if (config.apiKey) {
            localStorage.setItem(this.KEYS.API_KEY, config.apiKey);
        }
    },

    /**
     * 清空所有配置
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.APP_ID);
        localStorage.removeItem(this.KEYS.APP_SECRET);
        localStorage.removeItem(this.KEYS.API_KEY);
    },

    /**
     * 检查配置是否完整
     */
    isComplete() {
        const config = this.getAll();
        return !!(config.appId && config.appSecret && config.apiKey);
    },

    /**
     * 填充测试密钥
     */
    fillTestKeys() {
        const testKeys = this.TEST_KEYS;
        return {
            appId: testKeys.APP_ID || '',
            appSecret: testKeys.APP_SECRET || '',
            apiKey: testKeys.API_KEY || ''
        };
    },

    /**
     * 初始化配置表单
     */
    initForm() {
        const config = this.getAll();

        const appIdInput = document.getElementById('app-id');
        const appSecretInput = document.getElementById('app-secret');
        const apiKeyInput = document.getElementById('api-key');

        if (appIdInput) appIdInput.value = config.appId;
        if (appSecretInput) appSecretInput.value = config.appSecret;
        if (apiKeyInput) apiKeyInput.value = config.apiKey;
    }
};
