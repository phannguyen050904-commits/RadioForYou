// Các phần tử DOM
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const notification = document.getElementById('notification');
const timeModal = document.getElementById('timeModal');
const timePreview = document.getElementById('timePreview');
const confirmTimeBtn = document.getElementById('confirmTime');
const cancelTimeBtn = document.getElementById('cancelTime');
const customMinutes = document.getElementById('customMinutes');
const customSeconds = document.getElementById('customSeconds');

// Lấy tất cả các cài đặt thông báo
const notificationSettings = document.querySelectorAll('.setting-item');

// Biến toàn cục
let timerIntervals = [];
let isRunning = false;
let currentEditingTimer = null;
const folderHistory = './sound/History/';

// Định nghĩa các file âm thanh cho từng loại thông báo
const soundFiles = {
    eye: [
        'sound/eye/eye1.m4a',
        'sound/eye/eye2.m4a',
    ],
    sit: [
        'sound/sit/sit1.m4a',
        'sound/sit/sit2.m4a',
    ],
    drinkwater: [
        'sound/drinkwater/drinkwater1.m4a',
        'sound/drinkwater/drinkwater2.m4a',
        'sound/drinkwater/drinkwater3.m4a'
    ],
    warm: [
        'sound/warm/warm1.m4a',
        'sound/warm/warm2.m4a',
    ],
    history: [
        './sound/History/Constantinopolis.m4a',
        './sound/History/Plato.m4a',
        './sound/History/Mesopotamia.m4a',
        './sound/History/war100.m4a'

    ]
};

// Cache cho các audio element
const audioCache = {};

// Preload âm thanh
function preloadSounds() {
    for (const [category, files] of Object.entries(soundFiles)) {
        audioCache[category] = [];
        files.forEach((file, index) => {
            const audio = new Audio(file);
            audio.preload = 'auto';
            audioCache[category].push(audio);
        });
    }
}

// Phát âm thanh ngẫu nhiên
function playRandomNotificationSound(category, volume) {
    if (!audioCache[category] || audioCache[category].length === 0) {
        console.error('Không tìm thấy âm thanh cho category:', category);
        return;
    }

    // Chọn ngẫu nhiên một file âm thanh trong category
    const randomIndex = Math.floor(Math.random() * audioCache[category].length);
    const audio = audioCache[category][randomIndex].cloneNode();
    
    audio.volume = volume;
    audio.play().catch(error => {
        console.error('Lỗi phát âm thanh:', error);
    });
}

// Hiển thị thông báo
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Lấy cài đặt của thông báo theo index
function getNotificationSettings(index) {
    const setting = notificationSettings[index];
    const timerDisplay = setting.querySelector('.timer-display');
    return {
        soundType: setting.querySelector('.soundSelect').value,
        enabled: setting.querySelector('.soundToggle').checked,
        volume: setting.querySelector('.volumeControl').value / 100,
        time: parseInt(timerDisplay.getAttribute('data-time')),
        timerDisplay: timerDisplay
    };
}

// Định dạng thời gian
function formatTime(minutes, seconds) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Cập nhật preview thời gian
function updateTimePreview() {
    const minutes = parseInt(customMinutes.value) || 0;
    const seconds = parseInt(customSeconds.value) || 0;
    timePreview.textContent = formatTime(minutes, seconds);
}

// Hiển thị modal điều chỉnh thời gian
function showTimeModal(timerIndex) {
    if (isRunning) return;
    
    currentEditingTimer = timerIndex;
    const settings = getNotificationSettings(timerIndex);
    const minutes = Math.floor(settings.time);
    const seconds = Math.round((settings.time - minutes) * 60);
    
    // Đặt giá trị hiện tại
    customMinutes.value = minutes;
    customSeconds.value = seconds;
    
    // Cập nhật preview
    updateTimePreview();
    
    // Hiển thị modal
    timeModal.classList.add('show');
}

// Đóng modal
function hideTimeModal() {
    timeModal.classList.remove('show');
    currentEditingTimer = null;
}

// Áp dụng thời gian mới
function applyNewTime() {
    if (currentEditingTimer === null) return;
    
    const minutes = parseInt(customMinutes.value) || 0;
    const seconds = parseInt(customSeconds.value) || 0;
    const totalMinutes = minutes + (seconds / 60);
    
    if (totalMinutes > 0 && totalMinutes <= 60) {
        const timerDisplay = notificationSettings[currentEditingTimer].querySelector('.timer-display');
        timerDisplay.setAttribute('data-time', totalMinutes.toString());
        timerDisplay.textContent = formatTime(minutes, seconds);
        hideTimeModal();
    } else {
        alert('Thời gian phải từ 1 giây đến 60 phút!');
    }
}

// Bắt đầu tất cả bộ đếm thời gian
function startAllTimers() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    
    timerIntervals.forEach(interval => clearInterval(interval));
    timerIntervals = [];
    
    notificationSettings.forEach((_, index) => {
        startTimer(index);
    });
}

// Bắt đầu bộ đếm thời gian cho một thông báo cụ thể
function startTimer(index) {
    const settings = getNotificationSettings(index);
    let timeLeft = settings.time * 60;
    
    updateTimerDisplay(index, timeLeft);
    
    const interval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(index, timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            
            if (settings.enabled) {
                playRandomNotificationSound(settings.soundType, settings.volume);
            }
            
            setTimeout(() => {
                startTimer(index);
            }, 5000);
        }
    }, 1000);
    
    timerIntervals.push(interval);
}

// Dừng tất cả bộ đếm thời gian
function stopAllTimers() {
    timerIntervals.forEach(interval => clearInterval(interval));
    timerIntervals = [];
    isRunning = false;
    startBtn.disabled = false;
    
    notificationSettings.forEach((_, index) => {
        const settings = getNotificationSettings(index);
        const minutes = Math.floor(settings.time);
        const seconds = Math.round((settings.time - minutes) * 60);
        settings.timerDisplay.textContent = formatTime(minutes, seconds);
        settings.timerDisplay.style.color = "white";
    });
    
}

// Cập nhật hiển thị bộ đếm thời gian
function updateTimerDisplay(index, timeLeft) {
    const settings = getNotificationSettings(index);
    if (timeLeft > 0) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        settings.timerDisplay.textContent = formatTime(minutes, seconds);
        settings.timerDisplay.style.color = "white";
    } else {
        settings.timerDisplay.textContent = "00:00";
        settings.timerDisplay.style.color = "#ff6b6b";
    }
}

// Thiết lập các timer có thể chỉnh sửa
function setupEditableTimers() {
    document.querySelectorAll('.editable-timer').forEach((timer, index) => {
        timer.addEventListener('click', function() {
            showTimeModal(index);
        });
    });
}

// Sự kiện cho modal
confirmTimeBtn.addEventListener('click', applyNewTime);
cancelTimeBtn.addEventListener('click', hideTimeModal);

// Sự kiện cho input tùy chỉnh
customMinutes.addEventListener('input', updateTimePreview);
customSeconds.addEventListener('input', updateTimePreview);

// Đóng modal khi click bên ngoài
timeModal.addEventListener('click', function(e) {
    if (e.target === timeModal) {
        hideTimeModal();
    }
});

// Sự kiện nút
startBtn.addEventListener('click', startAllTimers);
stopBtn.addEventListener('click', stopAllTimers);

// Sự kiện nút nghe thử âm thanh
document.querySelectorAll('.test-sound').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const settings = getNotificationSettings(index);
        if (settings.enabled) {
            playRandomNotificationSound(settings.soundType, settings.volume);
        }
    });
});

// Khởi tạo
preloadSounds();
setupEditableTimers();
notificationSettings.forEach((_, index) => {
    const settings = getNotificationSettings(index);
    const minutes = Math.floor(settings.time);
    const seconds = Math.round((settings.time - minutes) * 60);
    settings.timerDisplay.textContent = formatTime(minutes, seconds);
});