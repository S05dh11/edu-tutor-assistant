/**
 * 程序入口
 * 负责初始化应用程序
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('=================================');
    console.log('AI学科辅导助手 - 启动中...');
    console.log('=================================');

    // 初始化UI
    UI.init();

    console.log('应用初始化完成');
    console.log('当前学科:', AI.getCurrentSubject());

    // 检查是否有保存的密钥
    if (Config.isComplete()) {
        console.log('✅ 已配置密钥，可以连接AI老师');
    } else {
        console.log('⚠️ 未配置密钥，请先点击"密钥配置"按钮进行配置');
    }

    console.log('=================================');
});

// 页面卸载前清理资源
window.addEventListener('beforeunload', () => {
    console.log('页面即将卸载，清理资源...');

    if (Avatar.isConnected()) {
        Avatar.disconnect();
    }
});

// 处理页面可见性变化（用于性能优化）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('页面进入后台');
        // 可以在这里添加后台逻辑
    } else {
        console.log('页面回到前台');
        // 可以在这里添加恢复逻辑
    }
});
