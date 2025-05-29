// 在页面加载时显示当前日期并初始化功能
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

    // 添加自动保存功能
    setupAutoSave();

    // 添加按钮事件监听
    document.getElementById('saveBtn').addEventListener('click', saveReport);
    document.getElementById('exportBtn').addEventListener('click', exportReport);
});

// 设置自动保存
function setupAutoSave() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', debounce(function() {
            saveReport(true); // true表示这是自动保存
        }, 1000)); // 1秒后自动保存
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
async function saveReport(isAutoSave = false) {
    const today = new Date().toISOString().split('T')[0];
    
    const report = {
        completedWork: document.getElementById('completedWork').value,
        ongoingWork: document.getElementById('ongoingWork').value,
        problems: document.getElementById('problems').value,
        timestamp: new Date().getTime()
    };

    try {
        await chrome.storage.local.set({ [today]: report });
        if (!isAutoSave) {
            showNotification('日报已保存');
        }
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

// 查看历史记录
async function viewHistory(type) {
    const days = 7; // 显示最近7天的记录
    const records = [];
    
    // 获取最近几天的记录
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const result = await chrome.storage.local.get(dateStr);
        
        if (result[dateStr]) {
            const record = result[dateStr];
            records.push({
                date: date.toLocaleDateString('zh-CN'),
                content: record[type + 'Work'] || record[type] || ''
            });
        }
    }

    // 显示历史记录
    let historyContent = '';
    records.forEach(record => {
        if (record.content) {
            historyContent += `${record.date}:\n${record.content}\n\n`;
        }
    });

    // 如果有历史记录，则显示
    if (historyContent) {
        const textarea = document.getElementById(type + 'Work');
        const originalContent = textarea.value;
        
        // 在当前内容下方显示历史记录
        textarea.value = originalContent + 
            (originalContent ? '\n\n--- 历史记录 ---\n\n' : '') + 
            historyContent;
    } else {
        showNotification('没有找到历史记录');
    }
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