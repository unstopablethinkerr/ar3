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
        drawHand(landmarks);
        const gesture = recognizeGesture(landmarks);
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

    // Pointing: Index finger extended, other fingers curled
    const isPointing = indexTip[1] < middleTip[1] &&
                       middleTip[1] > ringTip[1] &&
                       ringTip[1] > pinkyTip[1];

    // OK Sign: Thumb and index finger touching, other fingers curled
    const isOKSign = Math.abs(thumbTip[0] - indexTip[0]) < 20 &&
                     Math.abs(thumbTip[1] - indexTip[1]) < 20 &&
                     middleTip[1] > ringTip[1] &&
                     ringTip[1] > pinkyTip[1];

    // Rock (Rock-on): Index and pinky fingers extended, thumb curled, other fingers curled
    const isRockSign = indexTip[1] < middleTip[1] &&
                       pinkyTip[1] < ringTip[1] &&
                       middleTip[1] > ringTip[1];

    // Spread Fingers: All fingers spread apart
    const isSpreadFingers = Math.abs(indexTip[0] - middleTip[0]) > 50 &&
                            Math.abs(middleTip[0] - ringTip[0]) > 50 &&
                            Math.abs(ringTip[0] - pinkyTip[0]) > 50;

    if (isOpenHand) return "Open Hand 🖐️";
    if (isClosedFist) return "Closed Fist ✊";
    if (isThumbsUp) return "Thumbs Up 👍";
    if (isThumbsDown) return "Thumbs Down 👎";
    if (isPeaceSign) return "Peace ✌️";
    if (isPointing) return "Pointing ☝️";
    if (isOKSign) return "OK 👌";
    if (isRockSign) return "Rock-on 🤘";
    if (isSpreadFingers) return "Spread Fingers 🖐";

    return "Unknown Gesture";
}

// Initialize app
(async function init() {
    await setupCamera();
    const model = await loadHandposeModel();
    detectGestures(model);
})();
