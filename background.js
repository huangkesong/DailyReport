// 设置默认的提醒时间（每天下午5点）
const DEFAULT_REMINDER_HOUR = 17;
const DEFAULT_REMINDER_MINUTE = 0;

// 插件安装时初始化
chrome.runtime.onInstalled.addListener(function() {
    // 设置每日提醒
    setupDailyReminder();
    
    // 初始化存储默认设置
    chrome.storage.local.set({
        'reminderEnabled': true,
        'reminderHour': DEFAULT_REMINDER_HOUR,
        'reminderMinute': DEFAULT_REMINDER_MINUTE
    });

    // // 设置侧边栏默认状态
    // chrome.sidePanel.setOptions({
    //     enabled: true,
    //     path: 'sidebar.html'
    // });
});


// chrome.action.onClicked.addListener((tab) => {
//     chrome.sidePanel.setOptions({
//         tabId: tab.id,
//         enabled: true
//     });
//     chrome.sidePanel.open({windowId: tab.windowId});
// });

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
    console.log('chrome====>', tab);
    // 设置侧边栏默认状态
    chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true
    });
    if(tab.active) {
        await chrome.sidePanel.open({windowId: tab.windowId});
    } else {
        await chrome.sidePanel.close({windowId: tab.windowId});
    }
    
});


// 设置每日提醒
function setupDailyReminder() {
    // 创建或更新提醒闹钟
    chrome.alarms.create('dailyReminder', {
        when: getNextReminderTime(),
        periodInMinutes: 24 * 60 // 每24小时重复
    });
}

// 计算下一次提醒时间
function getNextReminderTime() {
    const now = new Date();
    const reminderTime = new Date(now);
    
    reminderTime.setHours(DEFAULT_REMINDER_HOUR);
    reminderTime.setMinutes(DEFAULT_REMINDER_MINUTE);
    reminderTime.setSeconds(0);
    
    // 如果今天的提醒时间已经过了，设置为明天
    if (now > reminderTime) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    return reminderTime.getTime();
}

// 监听闹钟事件
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'dailyReminder') {
        // 检查是否启用了提醒
        chrome.storage.local.get('reminderEnabled', function(data) {
            if (data.reminderEnabled) {
                showReminderNotification();
            }
        });
    }
});

// 显示提醒通知
function showReminderNotification() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    
    chrome.notifications.create('dailyReport', {
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: '日报提醒',
        message: `请记得填写${dateStr}的日报！`,
        priority: 2,
        buttons: [
            {
                title: '现在填写'
            },
            {
                title: '稍后提醒'
            }
        ]
    });
}

// 监听通知按钮点击事件
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (notificationId === 'dailyReport') {
        if (buttonIndex === 0) {
            // 点击"现在填写"，打开侧边栏
            chrome.sidePanel.open({});
            sidePanelOpen = true;
        } else if (buttonIndex === 1) {
            // 点击"稍后提醒"，30分钟后再次提醒
            chrome.alarms.create('reminderDelay', {
                delayInMinutes: 30
            });
        }
    }
});

// 每周清理超过30天的数据
chrome.alarms.create('weeklyCleanup', {
    periodInMinutes: 7 * 24 * 60 // 每周执行一次
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'weeklyCleanup') {
        cleanupOldData();
    }
});

function cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    chrome.storage.local.get(null, function(items) {
        for (let key in items) {
            if (key.startsWith('report_')) {
                const dateStr = key.replace('report_', '');
                const reportDate = new Date(dateStr);
                
                if (reportDate < thirtyDaysAgo) {
                    chrome.storage.local.remove(key);
                }
            }
        }
    });
}