// 在页面加载时显示当前日期
document.addEventListener('DOMContentLoaded', function() {
    // 显示当前日期
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    document.getElementById('currentDate').textContent = dateStr;

    // 加载今天的日报内容
    loadTodayReport();

    // 添加保存按钮事件监听
    document.getElementById('saveBtn').addEventListener('click', saveReport);

    // 添加导出按钮事件监听
    document.getElementById('exportBtn').addEventListener('click', exportReport);
});

// 加载今天的日报内容
async function loadTodayReport() {
    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get(today);
    
    if (result[today]) {
        const report = result[today];
        document.getElementById('completedWork').value = report.completedWork || '';
        document.getElementById('ongoingWork').value = report.ongoingWork || '';
        document.getElementById('problems').value = report.problems || '';
    }
}

// 保存日报内容
async function saveReport() {
    const today = new Date().toISOString().split('T')[0];
    
    const report = {
        completedWork: document.getElementById('completedWork').value,
        ongoingWork: document.getElementById('ongoingWork').value,
        problems: document.getElementById('problems').value,
        timestamp: new Date().getTime()
    };

    try {
        await chrome.storage.local.set({ [today]: report });
        showNotification('日报已保存');
    } catch (error) {
        showNotification('保存失败，请重试', true);
        console.error('保存失败:', error);
    }
}

// 导出日报
function exportReport() {
    const date = new Date().toLocaleDateString('zh-CN');
    const completedWork = document.getElementById('completedWork').value;
    const ongoingWork = document.getElementById('ongoingWork').value;
    const problems = document.getElementById('problems').value;

    const content = `日报内容 - ${date}\n\n` +
        `已完成工作：\n${completedWork}\n\n` +
        `进行中工作：\n${ongoingWork}\n\n` +
        `遇到的问题：\n${problems}`;

    // 创建一个Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `日报-${date}.txt`;
    
    // 触发下载
    downloadLink.click();
    
    // 清理URL对象
    URL.revokeObjectURL(downloadLink.href);
}

// 显示通知
function showNotification(message, isError = false) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
    notification.style.zIndex = '1000';

    // 添加到页面
    document.body.appendChild(notification);

    // 3秒后移除通知
    setTimeout(() => {
        notification.remove();
    }, 3000);
}