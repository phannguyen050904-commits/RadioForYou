
// Lấy các phần tử DOM
const videoElement = document.getElementById('videoElement');
const capturedImage = document.getElementById('capturedImage');
const toggleCameraBtn = document.getElementById('toggleCamera');
const capturePhotoBtn = document.getElementById('capturePhoto');
const retakePhotoBtn = document.getElementById('retakePhoto');
const cameraContainer = document.querySelector('.camera-container'); // Thêm dòng này

let stream = null;
let isCameraOn = false;

// Hàm bật máy ảnh
// Hàm bật máy ảnh
async function startCamera() {
    try {
        // Yêu cầu truy cập vào camera
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 160 }, 
                height: { ideal: 160 } 
            } 
        });
        
        // Hiển thị video từ camera
        videoElement.srcObject = stream;
        isCameraOn = true;
        
        // Hiển thị camera container
        cameraContainer.style.display = 'block';
        
        // Thêm dòng này để lật ngược camera (hiệu ứng gương)
        videoElement.style.transform = 'scaleX(-1)';
        
        // Cập nhật giao diện
        capturePhotoBtn.disabled = false;
        retakePhotoBtn.disabled = true;
        capturedImage.style.display = 'none';
        videoElement.style.display = 'block';
        
    } catch (error) {
        console.error('Lỗi khi truy cập camera:', error);

    }
}

// Hàm tắt máy ảnh
function stopCamera() {
    if (stream) {
        // Dừng tất cả các track
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    isCameraOn = false;
    
    // Ẩn camera container
    cameraContainer.style.display = 'none'; // Thêm dòng này
    
    // Cập nhật giao diện
    capturePhotoBtn.disabled = true;
    retakePhotoBtn.disabled = true;
    videoElement.style.display = 'none';
    capturedImage.style.display = 'none';
}

// Hàm chụp ảnh
function capturePhoto() {
    if (!isCameraOn) return;
    
    // Tạo canvas để chụp ảnh từ video
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    
    // Lật ngược canvas để ảnh hiển thị đúng hướng
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    
    // Vẽ frame hiện tại từ video lên canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Chuyển canvas thành URL dữ liệu và hiển thị ảnh
    capturedImage.src = canvas.toDataURL('image/png');
    capturedImage.style.display = 'block';
    capturedImage.style.transform = 'scaleX(1)'; // Đảm bảo ảnh hiển thị đúng hướng
    videoElement.style.display = 'none';
    
    // Cập nhật giao diện
    retakePhotoBtn.disabled = false;
}

// Hàm chụp lại ảnh
function retakePhoto() {
    if (!isCameraOn) return;
    
    // Hiển thị lại video và ẩn ảnh đã chụp
    videoElement.style.display = 'block';
    capturedImage.style.display = 'none';
    
    // Cập nhật giao diện
    retakePhotoBtn.disabled = true;
}

// Gán sự kiện cho các nút
toggleCameraBtn.addEventListener('click', () => {
    if (isCameraOn) {
        stopCamera();
    } else {
        startCamera();
    }
});

capturePhotoBtn.addEventListener('click', capturePhoto);
retakePhotoBtn.addEventListener('click', retakePhoto);
