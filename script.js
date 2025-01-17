const video = document.getElementById("camera");
const canvas = document.getElementById("gesture-overlay");
const ctx = canvas.getContext("2d");
const gestureName = document.getElementById("gesture-name");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Set up the rear camera
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    } catch (error) {
        console.error("Camera setup failed:", error);
        alert("Unable to access the camera.");
    }
}

// Load the Handpose model
async function loadHandposeModel() {
    const model = await handpose.load();
    console.log("Handpose model loaded.");
    return model;
}

// Detect gestures
async function detectGestures(model) {
    const predictions = await model.estimateHands(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        const augmentedLandmarks = augmentData(landmarks);
        applyBackgroundSubtraction(video, canvas, ctx);
        segmentHandRegion(augmentedLandmarks, canvas, ctx);
        drawHand(augmentedLandmarks);
        const gesture = recognizeGesture(augmentedLandmarks);
        gestureName.textContent = gesture;
    } else {
        gestureName.textContent = "None";
    }

    requestAnimationFrame(() => detectGestures(model));
}

// Draw hand landmarks
function drawHand(landmarks) {
    ctx.fillStyle = "red";
    landmarks.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(
            x / video.videoWidth * canvas.width,
            y / video.videoHeight * canvas.height,
            5, 0, 2 * Math.PI
        );
        ctx.fill();
    });
}

// Recognize gestures
function recognizeGesture(landmarks) {
    const [thumbTip, indexTip, middleTip, ringTip, pinkyTip] = [
        landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]
    ];

    // Open Hand: All fingers extended
    const isOpenHand = thumbTip[1] < indexTip[1] &&
                       indexTip[1] < middleTip[1] &&
                       middleTip[1] < ringTip[1] &&
                       ringTip[1] < pinkyTip[1];

    // Closed Fist: All fingertips are close to the palm
    const isClosedFist = thumbTip[1] > indexTip[1] &&
                         indexTip[1] > middleTip[1] &&
                         middleTip[1] > ringTip[1] &&
                         ringTip[1] > pinkyTip[1];

    // Thumbs Up: Thumb extended, other fingers curled
    const isThumbsUp = thumbTip[1] < indexTip[1] &&
                       indexTip[1] > middleTip[1] &&
                       middleTip[1] > ringTip[1] &&
                       ringTip[1] > pinkyTip[1];

    // Thumbs Down: Thumb extended downward, other fingers curled
    const isThumbsDown = thumbTip[1] > indexTip[1] &&
                         indexTip[1] > middleTip[1] &&
                         middleTip[1] > ringTip[1] &&
                         ringTip[1] > pinkyTip[1];

    // Peace Sign: Thumb curled, index and middle extended, others curled
    const isPeaceSign = thumbTip[1] > indexTip[1] &&
                        indexTip[1] < middleTip[1] &&
                        middleTip[1] > ringTip[1] &&
                        ringTip[1] > pinkyTip[1];

    if (isOpenHand) return "Open Hand 🖐️";
    if (isClosedFist) return "Closed Fist ✊";
    if (isThumbsUp) return "Thumbs Up 👍";
    if (isThumbsDown) return "Thumbs Down 👎";
    if (isPeaceSign) return "Peace ✌️";

    return "Unknown Gesture";
}

// Data Augmentation
function augmentData(landmarks) {
    // Example: Rotate landmarks
    const rotatedLandmarks = landmarks.map(point => {
        // Rotate point by 90 degrees
        return [point[1], -point[0]];
    });
    return rotatedLandmarks;
}

// Background Subtraction
function applyBackgroundSubtraction(video, canvas, ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Simple thresholding
        if (r < 100 && g < 100 && b < 100) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// Hand Region Segmentation
function segmentHandRegion(landmarks, canvas, ctx) {
    ctx.beginPath();
    landmarks.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point[0], point[1]);
        } else {
            ctx.lineTo(point[0], point[1]);
        }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
}

// Initialize app
(async function init() {
    await setupCamera();
    const model = await loadHandposeModel();
    detectGestures(model);
})();
