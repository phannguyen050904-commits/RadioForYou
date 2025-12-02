// ============ ADD NEW SETTING ITEM ============

function createNewSettingItem() {
    const settingItemHTML = `
        <div class="setting-item">
            <div class="sound">
                <div class="custom-select">
                    <div class="selected">Select song</div>
                    <ul class="select-menu">
                        <li class="menu-parent">

                            <li data-value="piam">_p.iam_</li>
                            <li data-value="Sonnguyn">Sonnguyn</li>

                    </ul>
                </div>


                <div class="timer-display editable-timer" data-time="20">20:00</div>
                <div class="controls">
                    <button class="start-btn">
                        <img src="ui/starticon.png" class="starticon" alt="starticon">
                    </button>
                    <button class="stop-btn" style="display: none;">
                        <img src="ui/stopicon.png" class="stopicon" alt="stopicon">
                    </button>
                </div>
                <button class="remove-btn" data-index="0">
                </button>
                <div class="volume-control-container">
                    <button class="test-sound"></button>
                    <input type="range" class="volumeControl" min="0" max="100" value="70">
                </div>
            </div>
        </div>
    `;
    
    return settingItemHTML;
}

function addNewSettingItem() {
    const setting = document.querySelector('.setting');
    const classControls = document.querySelector('.class-controls');
    
    if (!setting || !classControls) {
        console.error('Không tìm thấy container để thêm setting item');
        return;
    }
    
    // Tạo HTML cho setting item mới
    const newItemHTML = createNewSettingItem();
    
    // Thêm vào trước nút class-controls
    classControls.insertAdjacentHTML('beforebegin', newItemHTML);
    
    // Lấy setting item vừa tạo
    const allItems = document.querySelectorAll('.setting-item');
    const newItem = allItems[allItems.length - 1];
    
    // Khởi tạo các event listeners cho item mới
    if (typeof initializeEventListenersForItem === 'function') {
        initializeEventListenersForItem(newItem);
    }
    
    // Cập nhật lại index cho tất cả remove buttons
    if (typeof updateRemoveButtonsIndexes === 'function') {
        updateRemoveButtonsIndexes();
    }
    
    // Scroll xuống item mới (tùy chọn)
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    console.log('Đã thêm setting item mới');
}

// ============ INITIALIZE ADD BUTTON ============
document.addEventListener('DOMContentLoaded', () => {
    const addClassBtn = document.getElementById('addClassBtn');
    
    if (addClassBtn) {
        addClassBtn.addEventListener('click', () => {
            addNewSettingItem();
        });
        console.log('Add button initialized');
    } else {
        console.error('Không tìm thấy nút addClassBtn');
    }
});



