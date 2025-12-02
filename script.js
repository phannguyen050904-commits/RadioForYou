// ============ GLOBAL VARIABLES ============
let timerIntervals = [];
let currentAudio = null; 
let audioQueue = [];

// Audio player state
let currentAudioPlayer = null;
let isPlaying = false;
let updateInterval = null;

// Sound files configuration
const soundFiles = {
    piam: ['Não Cá Vàng'].map(f => `./sound/piam/${f}.m4a`),
    Sonnguyn: ['Người như anh xứng đáng cô đơn'].map(f => `./sound/Sonnguyn/${f}.m4a`),
    Giaminh: ['Dừng lại và quên thôi'].map(f => `./sound/Gia Minh/${f}.m4a`)

};

const audioCache = {};

// Category names mapping
const categoryNames = {
    'piam': '_p.iam_',
    'Sonnguyn': 'Sonnguyn',
    'Giaminh': 'Gia Minh'
};

// Vinyl images mapping
const vinylImages = {
    'piam': 'disque/piam.png',
    'Sonnguyn': 'disque/Sonnguyn.png',
    'Giaminh': 'disque/đĩa đen.png',
};

// ============ PRELOAD SOUNDS ============
function preloadSounds() {
    Object.entries(soundFiles).forEach(([category, files]) => {
        audioCache[category] = files.map(file => {
            const audio = new Audio(file);
            audio.preload = 'auto';
            return audio;
        });
    });
}

// ============ AUDIO PLAYER FUNCTIONS ============
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateProgressBar() {
    if (!currentAudioPlayer) return;
    
    const currentTime = currentAudioPlayer.currentTime;
    const duration = currentAudioPlayer.duration || 0;
    const progressPercent = (currentTime / duration) * 100;
    
    const audioProgress = document.getElementById('audioProgress');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    
    if (audioProgress) audioProgress.style.width = `${progressPercent}%`;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(duration);
}

function updatePlayerUI() {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    if (!playIcon || !pauseIcon) return;
    
    if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

function togglePlayPause() {
    if (!currentAudioPlayer) return;
    
    if (isPlaying) {
        currentAudioPlayer.pause();
        isPlaying = false;
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    } else {
        currentAudioPlayer.play();
        isPlaying = true;
        updateInterval = setInterval(updateProgressBar, 100);
    }
    
    updatePlayerUI();
}

function seekAudio(e) {
    if (!currentAudioPlayer) return;
    
    const progressBarRect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - progressBarRect.left) / progressBarRect.width;
    const seekTime = clickPosition * currentAudioPlayer.duration;
    
    currentAudioPlayer.currentTime = seekTime;
    updateProgressBar();
}

function setupAudioPlayer(audioElement, category, fileName) {
    // Stop previous audio if playing
    if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        isPlaying = false;
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    // Set new audio
    currentAudioPlayer = audioElement;
    
    // Get UI elements
    const audioProgress = document.getElementById('audioProgress');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const currentAudioTitle = document.querySelector('.current-audio-title');
    const currentAudioCategory = document.querySelector('.current-audio-category');
    const vinylDisc = document.querySelector('.vinyl-disc');
    
    // Reset UI
    if (audioProgress) audioProgress.style.width = '0%';
    if (currentTimeEl) currentTimeEl.textContent = '00:00';
    
    // Change vinyl image based on category
    if (vinylDisc && vinylImages[category]) {
        vinylDisc.src = vinylImages[category];
        vinylDisc.classList.add('spinning');
    }
    
    // Update audio info display
    if (currentAudioTitle) {
        currentAudioTitle.textContent = `${categoryNames[category] || category} - ${fileName}`;
    }
    
    // Set up event listeners for the new audio
    currentAudioPlayer.addEventListener('loadedmetadata', () => {
        if (totalTimeEl) totalTimeEl.textContent = formatTime(currentAudioPlayer.duration);
    });
    
    currentAudioPlayer.addEventListener('timeupdate', updateProgressBar);
    
    currentAudioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayerUI();
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        
        // Stop vinyl spinning
        if (vinylDisc) vinylDisc.classList.remove('spinning');
        
        // Reset after a delay
        setTimeout(() => {
            if (audioProgress) audioProgress.style.width = '0%';
            if (currentTimeEl) currentTimeEl.textContent = '00:00';
            if (totalTimeEl) totalTimeEl.textContent = '00:00';
            if (vinylDisc) vinylDisc.src = 'disque/piam.png';
        }, 2000);
    });
    
    // Start playing
    currentAudioPlayer.play().catch(err => {
        console.error('Lỗi phát audio:', err);
    });
    isPlaying = true;
    updatePlayerUI();
    updateInterval = setInterval(updateProgressBar, 100);
}

// ============ NOTIFICATION SOUND FUNCTIONS ============
function playRandomNotificationSound(category, volume, onEnded, index) {
    if (!audioCache[category]?.length) {
        console.error('Không tìm thấy âm thanh cho category:', category);
        if (onEnded) onEnded();
        return;
    }
    
    // Thêm vào hàng đợi nếu đang có âm thanh khác phát
    if (currentAudio) {
        audioQueue.push({ category, volume, onEnded, index });
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * audioCache[category].length);
    const audio = audioCache[category][randomIndex].cloneNode();
    audio.volume = volume;
    
    // Get file name for display
    const fileName = soundFiles[category][randomIndex]
        .split('/').pop()
        .replace('.m4a', '')
        .replace(/_/g, ' ');
    
    // Set up player for this audio
    setupAudioPlayer(audio, category, fileName);
    
    // Đánh dấu audio đang phát globally
    currentAudio = audio;
    
    // Xử lý khi âm thanh kết thúc
    const handleEnded = () => {
        currentAudio = null;
        if (onEnded) onEnded();
        
        // Phát âm thanh tiếp theo trong hàng đợi
        if (audioQueue.length > 0) {
            const next = audioQueue.shift();
            playRandomNotificationSound(next.category, next.volume, next.onEnded, next.index);
        }
    };
    
    audio.addEventListener('ended', handleEnded);
    
    audio.play().catch(error => {
        console.error('Lỗi phát âm thanh:', error);
        currentAudio = null;
        if (onEnded) onEnded();
        
        // Tiếp tục hàng đợi ngay cả khi có lỗi
        if (audioQueue.length > 0) {
            const next = audioQueue.shift();
            playRandomNotificationSound(next.category, next.volume, next.onEnded, next.index);
        }
    });
}

// ============ TIMER FUNCTIONS ============
function getNotificationSettings(settingItem) {
    const customSelect = settingItem.querySelector('.custom-select');
    const selectedValue = customSelect.getAttribute('data-value') || 'piam';
    
    return {
        soundType: selectedValue,
        volume: settingItem.querySelector('.volumeControl').value / 100,
        time: parseFloat(settingItem.querySelector('.timer-display').getAttribute('data-time')),
        timerDisplay: settingItem.querySelector('.timer-display')
    };
}

const getSettingItemIndex = (settingItem) => 
    Array.from(document.querySelectorAll('.setting-item')).indexOf(settingItem);

const formatTimeDisplay = (minutes, seconds) => 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

function toggleButtons(settingItem, showStart) {
    const startBtn = settingItem.querySelector('.start-btn');
    const stopBtn = settingItem.querySelector('.stop-btn');
    
    if (startBtn) startBtn.style.display = showStart ? 'block' : 'none';
    if (stopBtn) stopBtn.style.display = showStart ? 'none' : 'block';
}

function startTimer(settingItem) {
    const index = getSettingItemIndex(settingItem);
    const settings = getNotificationSettings(settingItem);
    let timeLeft = Math.round(settings.time * 60);
    
    updateTimerDisplay(settingItem, timeLeft);
    toggleButtons(settingItem, false);
    
    const interval = setInterval(() => {
        if (!document.body.contains(settingItem)) {
            clearInterval(interval);
            return;
        }
        
        timeLeft--;
        updateTimerDisplay(settingItem, timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            playRandomNotificationSound(settings.soundType, settings.volume, () => {
                if (document.body.contains(settingItem)) {
                    startTimer(settingItem);
                }
            }, index);
        }
    }, 1000);
    
    timerIntervals[index] = timerIntervals[index] || [];
    timerIntervals[index].push(interval);
}

function stopTimer(settingItem) {
    const index = getSettingItemIndex(settingItem);
    if (!timerIntervals[index]) return;
    
    timerIntervals[index].forEach(interval => clearInterval(interval));
    timerIntervals[index] = [];
    
    // Dừng âm thanh đang phát ngay lập tức
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Xóa hàng đợi audio
    audioQueue = audioQueue.filter(item => item.index !== index);
    
    const settings = getNotificationSettings(settingItem);
    const minutes = Math.floor(settings.time);
    const seconds = Math.round((settings.time - minutes) * 60);
    settings.timerDisplay.textContent = formatTimeDisplay(minutes, seconds);
    settings.timerDisplay.style.color = "black";
    
    toggleButtons(settingItem, true);
}

function updateTimerDisplay(settingItem, timeLeft) {
    const timerDisplay = settingItem.querySelector('.timer-display');
    
    if (timeLeft > 0) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = formatTimeDisplay(minutes, seconds);
        timerDisplay.style.color = "black";
    } else {
        timerDisplay.textContent = "00:00";
        timerDisplay.style.color = "#000000ff";
    }
}

// ============ TIMER EDITOR ============
function initializeInlineTimerEdit(settingItem) {
    const timerDisplay = settingItem.querySelector('.timer-display');
    let isEditing = false;
    
    timerDisplay.addEventListener('click', (e) => {
        if (isEditing) return;
        
        const index = getSettingItemIndex(settingItem);
        
        if (timerIntervals[index]?.length) {
            alert('Vui lòng dừng timer trước khi chỉnh sửa thời gian!');
            return;
        }
        
        isEditing = true;
        
        const currentTime = timerDisplay.getAttribute('data-time');
        const totalSeconds = Math.round(parseFloat(currentTime) * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const editorHTML = `
            <div class="inline-timer-editor">
                <input type="number" class="minutes-input" min="0" max="59" value="${minutes}">
                <span class="separator">:</span>
                <input type="number" class="seconds-input" min="0" max="59" value="${seconds}">
            </div>
        `;
        
        timerDisplay.style.display = 'none';
        timerDisplay.insertAdjacentHTML('afterend', editorHTML);
        
        const editor = settingItem.querySelector('.inline-timer-editor');
        const minutesInput = editor.querySelector('.minutes-input');
        const secondsInput = editor.querySelector('.seconds-input');
        
        minutesInput.focus();
        minutesInput.select();
        
        const limitValue = (input, max) => {
            let value = parseInt(input.value) || 0;
            if (value > max) input.value = max;
            else if (value < 0) input.value = 0;
        };
        
        minutesInput.addEventListener('input', () => limitValue(minutesInput, 59));
        secondsInput.addEventListener('input', () => limitValue(secondsInput, 59));
        
        const updateTime = () => {
            if (!isEditing) return false;
            
            let newMinutes = parseInt(minutesInput.value) || 0;
            let newSeconds = parseInt(secondsInput.value) || 0;
            
            newMinutes = Math.min(59, Math.max(0, newMinutes));
            newSeconds = Math.min(59, Math.max(0, newSeconds));
            
            // Nếu thời gian là 00:00, tự động chuyển thành 00:01
            if (newMinutes === 0 && newSeconds === 0) {
                newSeconds = 1;
            }
            
            const totalMinutes = newMinutes + (newSeconds / 60);
            
            timerDisplay.setAttribute('data-time', totalMinutes.toString());
            timerDisplay.textContent = formatTimeDisplay(newMinutes, newSeconds);
            
            editor.remove();
            timerDisplay.style.display = 'inline-block';
            isEditing = false;
            return true;
        };
        
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                updateTime();
            } else if (e.key === 'Escape') {
                editor.remove();
                timerDisplay.style.display = 'inline-block';
                isEditing = false;
            }
        };
        
        minutesInput.addEventListener('keydown', handleEnter);
        secondsInput.addEventListener('keydown', handleEnter);
        
        setTimeout(() => {
            document.addEventListener('click', function closeEditor(e) {
                if (!editor.contains(e.target) && e.target !== timerDisplay && isEditing) {
                    updateTime();
                    document.removeEventListener('click', closeEditor);
                }
            });
        }, 100);
    });
}

// ============ DROPDOWN FUNCTIONS ============
function initializeCustomDropdown(settingItem) {
    const customSelect = settingItem.querySelector('.custom-select');
    const selected = customSelect.querySelector('.selected');
    const selectMenu = customSelect.querySelector('.select-menu');
    
    customSelect.setAttribute('data-value', 'piam');
    
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            selectMenu.classList.remove('active');
        }
    });
    
    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        selectMenu.classList.toggle('active');
    });
    
    selectMenu.addEventListener('click', (e) => {
        const target = e.target.closest('li[data-value]');
        if (!target) return;
        
        const value = target.getAttribute('data-value');
        const label = target.textContent.trim();
        
        selected.textContent = label;
        customSelect.setAttribute('data-value', value);
        selectMenu.classList.remove('active');
        
        e.stopPropagation();
    });
    
    const menuParents = selectMenu.querySelectorAll('.menu-parent');
    menuParents.forEach(parent => {
        parent.addEventListener('click', (e) => {
            if (e.target.closest('li[data-value]')) return;
            e.stopPropagation();
        });
    });
}

// ============ VOLUME FUNCTIONS ============
function createVolumeBars(settingItem) {
    const volumeControl = settingItem.querySelector('.volumeControl');
    const currentValue = parseInt(volumeControl.value);
    
    const volumeContainer = document.createElement('div');
    volumeContainer.className = 'volume-container';
    
    for (let i = 1; i <= 10; i++) {
        const bar = document.createElement('div');
        bar.className = 'volume-bar';
        bar.dataset.level = i;
        
        if (i * 10 <= currentValue) {
            bar.classList.add('active');
        } else {
            bar.classList.add('inactive');
        }
        
        const randomRotate = (Math.random() - 0.5) * 2;
        bar.style.transform = `rotate(${randomRotate}deg)`;
        
        bar.addEventListener('click', () => {
            updateVolume(settingItem, i);
        });
        
        volumeContainer.appendChild(bar);
    }
    
    volumeControl.parentNode.insertBefore(volumeContainer, volumeControl.nextSibling);
}

function updateVolume(settingItem, level) {
    const volumeControl = settingItem.querySelector('.volumeControl');
    const bars = settingItem.querySelectorAll('.volume-bar');
    
    volumeControl.value = level * 10;
    
    // FIX: Áp dụng volume cho audio player đang phát
    if (currentAudioPlayer) {
        currentAudioPlayer.volume = (level * 10) / 100;
    }
    
    bars.forEach((bar, index) => {
        if (index < level) {
            bar.classList.remove('inactive');
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
            bar.classList.add('inactive');
        }
    });
}

// ============ REMOVE REMINDER ============
function removeReminder(index) {
    const settingItems = document.querySelectorAll('.setting-item');
    
    if (index < 0 || index >= settingItems.length) {
        console.error('Invalid index:', index);
        return;
    }
    
    stopTimer(settingItems[index]);
    
    // Dừng âm thanh đang phát ngay lập tức
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Xóa hàng đợi audio liên quan đến reminder này
    audioQueue = audioQueue.filter(item => item.index !== index);
    
    if (timerIntervals[index]) {
        timerIntervals[index].forEach(interval => clearInterval(interval));
        timerIntervals[index] = [];
    }
    
    settingItems[index].remove();
    timerIntervals.splice(index, 1);
    updateRemoveButtonsIndexes();
}

function updateRemoveButtonsIndexes() {
    const settingItems = document.querySelectorAll('.setting-item');
    
    settingItems.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.setAttribute('data-index', index);
        }
    });
}

// ============ INITIALIZE EVENT LISTENERS ============
function initializeEventListenersForItem(settingItem) {
    const testSoundBtn = settingItem.querySelector('.test-sound');
    const removeBtn = settingItem.querySelector('.remove-btn');
    const startBtn = settingItem.querySelector('.start-btn');
    const stopBtn = settingItem.querySelector('.stop-btn');
    const volumeControl = settingItem.querySelector('.volumeControl');
    
    initializeInlineTimerEdit(settingItem);
    
    if (testSoundBtn) {
        testSoundBtn.addEventListener('click', () => {
            const settings = getNotificationSettings(settingItem);
            playRandomNotificationSound(settings.soundType, settings.volume);
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            stopTimer(settingItem);
            removeReminder(getSettingItemIndex(settingItem));
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            stopTimer(settingItem);
            startTimer(settingItem);
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => stopTimer(settingItem));
    }
    
    // FIX: Thêm event listener cho volume slider
    if (volumeControl) {
        volumeControl.addEventListener('input', (e) => {
            const level = Math.ceil(e.target.value / 10);
            updateVolume(settingItem, level);
        });
    }
    
    initializeCustomDropdown(settingItem);
    
    const settings = getNotificationSettings(settingItem);
    const minutes = Math.floor(settings.time);
    const seconds = Math.round((settings.time - minutes) * 60);
    settings.timerDisplay.textContent = formatTimeDisplay(minutes, seconds);
    
    createVolumeBars(settingItem);
}

// ============ INITIALIZE AUDIO PLAYER ============
function initializeAudioPlayer() {
    const audioPlayPauseBtn = document.getElementById('audioPlayPause');
    const audioProgressBar = document.getElementById('audioProgressBar');
    
    if (audioPlayPauseBtn) {
        audioPlayPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    if (audioProgressBar) {
        audioProgressBar.addEventListener('click', seekAudio);
    }
}

// ============ PREVENT ZOOM ============
document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && 
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
    }
});

document.addEventListener('wheel', function(e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    preloadSounds();
    
    document.querySelectorAll('.setting-item').forEach(item => {
        console.log('Initializing setting item:', item);
        initializeEventListenersForItem(item);
    });
    
    initializeAudioPlayer();
    
    console.log('Initialization complete');
});



// Thêm vào script.js

// ============ SOUND WAVE INDICATOR ============
function createSoundWaveIndicator(settingItem) {
    const timerDisplay = settingItem.querySelector('.timer-display');
    
    // Kiểm tra nếu đã có indicator rồi thì không tạo nữa
    if (settingItem.querySelector('.sound-wave-indicator')) {
        return;
    }
    
    const soundWave = document.createElement('div');
    soundWave.className = 'sound-wave-indicator';
    
    // Tạo 5 thanh âm thanh
    for (let i = 0; i < 5; i++) {
        const bar = document.createElement('div');
        bar.className = 'sound-wave-bar';
        soundWave.appendChild(bar);
    }
    
    // Thêm vào sau timer display
    timerDisplay.parentNode.insertBefore(soundWave, timerDisplay.nextSibling);
}

function showSoundWaveIndicator(settingItem) {
    const indicator = settingItem.querySelector('.sound-wave-indicator');
    if (indicator) {
        indicator.classList.add('active');
    }
}

function hideSoundWaveIndicator(settingItem) {
    const indicator = settingItem.querySelector('.sound-wave-indicator');
    if (indicator) {
        indicator.classList.remove('active');
    }
}

// ============ CẬP NHẬT HÀM TIMER ============
// Thay thế hàm startTimer hiện tại bằng code này:

function startTimer(settingItem) {
    const index = getSettingItemIndex(settingItem);
    const settings = getNotificationSettings(settingItem);
    let timeLeft = Math.round(settings.time * 60);
    
    updateTimerDisplay(settingItem, timeLeft);
    toggleButtons(settingItem, false);
    
    // Hiển thị sound wave indicator
    showSoundWaveIndicator(settingItem);
    
    const interval = setInterval(() => {
        if (!document.body.contains(settingItem)) {
            clearInterval(interval);
            hideSoundWaveIndicator(settingItem);
            return;
        }
        
        timeLeft--;
        updateTimerDisplay(settingItem, timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            playRandomNotificationSound(settings.soundType, settings.volume, () => {
                if (document.body.contains(settingItem)) {
                    startTimer(settingItem);
                }
            }, index);
        }
    }, 1000);
    
    timerIntervals[index] = timerIntervals[index] || [];
    timerIntervals[index].push(interval);
}

// Cập nhật hàm stopTimer
function stopTimer(settingItem) {
    const index = getSettingItemIndex(settingItem);
    if (!timerIntervals[index]) return;
    
    timerIntervals[index].forEach(interval => clearInterval(interval));
    timerIntervals[index] = [];
    
    // Ẩn sound wave indicator
    hideSoundWaveIndicator(settingItem);
    
    // Dừng âm thanh đang phát ngay lập tức
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Xóa hàng đợi audio
    audioQueue = audioQueue.filter(item => item.index !== index);
    
    const settings = getNotificationSettings(settingItem);
    const minutes = Math.floor(settings.time);
    const seconds = Math.round((settings.time - minutes) * 60);
    settings.timerDisplay.textContent = formatTimeDisplay(minutes, seconds);
    settings.timerDisplay.style.color = "black";
    
    toggleButtons(settingItem, true);
}

// Cập nhật hàm initializeEventListenersForItem để tạo sound wave indicator
function initializeEventListenersForItem(settingItem) {
    const testSoundBtn = settingItem.querySelector('.test-sound');
    const removeBtn = settingItem.querySelector('.remove-btn');
    const startBtn = settingItem.querySelector('.start-btn');
    const stopBtn = settingItem.querySelector('.stop-btn');
    const volumeControl = settingItem.querySelector('.volumeControl');
    
    // Tạo sound wave indicator
    createSoundWaveIndicator(settingItem);
    
    initializeInlineTimerEdit(settingItem);
    
    if (testSoundBtn) {
        testSoundBtn.addEventListener('click', () => {
            const settings = getNotificationSettings(settingItem);
            playRandomNotificationSound(settings.soundType, settings.volume);
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            stopTimer(settingItem);
            removeReminder(getSettingItemIndex(settingItem));
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            stopTimer(settingItem);
            startTimer(settingItem);
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => stopTimer(settingItem));
    }
    
    if (volumeControl) {
        volumeControl.addEventListener('input', (e) => {
            const level = Math.ceil(e.target.value / 10);
            updateVolume(settingItem, level);
        });
    }
    
    initializeCustomDropdown(settingItem);
    
    const settings = getNotificationSettings(settingItem);
    const minutes = Math.floor(settings.time);
    const seconds = Math.round((settings.time - minutes) * 60);
    settings.timerDisplay.textContent = formatTimeDisplay(minutes, seconds);
    
    createVolumeBars(settingItem);
}