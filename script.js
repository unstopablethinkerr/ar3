// script.js

// Get DOM elements
const video = document.querySelector('video');
const borderHighlight = document.getElementById('border-highlight');
const gestureBox = document.getElementById('gesture-box');

// Set canvas dimensions to match video feed
const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;
const ctx = canvas.getContext('2d');

// Function to set up the rear camera
async function setupRearCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const rearCamera = devices.find(
    (device) =>
      device.kind === 'videoinput' && device.label.toLowerCase().includes('back')
  );

  if (!rearCamera) {
    console.error('Rear camera not found.');
    return;
  }

  const constraints = {
    video: {
      deviceId: rearCamera.deviceId ? { exact: rearCamera.deviceId } : undefined,
      facingMode: { ideal: 'environment' }, // Prefer rear camera
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

// Function to load the Handpose model
async function loadHandposeModel() {
  try {
    const model = await handpose.load();
    console.log('Handpose model loaded successfully.');
    return model;
  } catch (error) {
    console.error('Error loading the Handpose model:', error);
    alert('Failed to load the Handpose model. Please check your internet connection.');
  }
}

// Function to detect hand gestures
async function detectHandGestures(model) {
  if (!model) return;

  // Get hand predictions
  const predictions = await model.estimateHands(video);

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (predictions.length > 0) {
    // Hand detected
    borderHighlight.setAttribute('visible', true);
    gestureBox.setAttribute('visible', true);

    // Draw hand landmarks
    const landmarks = predictions[0].landmarks;
    drawHand(landmarks);

    // Check for specific gestures
    checkGesture(landmarks);
  } else {
    // No hand detected
    borderHighlight.setAttribute('visible', false);
    gestureBox.setAttribute('visible', false);
    gestureBox.setAttribute('text', 'value: No hand detected; align: center; width: 4; color: white');
  }

  // Continuously detect gestures
  requestAnimationFrame(() => detectHandGestures(model));
}

// Function to draw hand landmarks on the canvas
function drawHand(landmarks) {
  ctx.fillStyle = 'red';
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = landmarks[i];
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle for each landmark
    ctx.fill();
  }
}

// Function to check for specific gestures
function checkGesture(landmarks) {
  // Get key landmarks
  const thumbTip = landmarks[4];  // Thumb tip
  const indexTip = landmarks[8];  // Index finger tip
  const middleTip = landmarks[12]; // Middle finger tip
  const ringTip = landmarks[16];  // Ring finger tip
  const pinkyTip = landmarks[20]; // Pinky finger tip

  // Check for "Open Hand" gesture
  const isHandOpen = thumbTip[1] < indexTip[1] && indexTip[1] < middleTip[1] && middleTip[1] < ringTip[1] && ringTip[1] < pinkyTip[1];

  // Check for "Closed Fist" gesture
  const isHandClosed = thumbTip[1] > indexTip[1] && indexTip[1] > middleTip[1] && middleTip[1] > ringTip[1] && ringTip[1] > pinkyTip[1];

  // Update response based on gesture
  if (isHandOpen) {
    gestureBox.setAttribute('text', 'value: Hand Open Detected! 🖐️; align: center; width: 4; color: white');
  } else if (isHandClosed) {
    gestureBox.setAttribute('text', 'value: Closed Fist Detected! ✊; align: center; width: 4; color: white');
  } else {
    gestureBox.setAttribute('text', 'value: No specific gesture detected.; align: center; width: 4; color: white');
  }
}

// Initialize the project
async function init() {
  // Set up the rear camera
  await setupRearCamera();

  // Load the Handpose model
  const model = await loadHandposeModel();

  // Start detecting hand gestures
  detectHandGestures(model);
}

// Run the initialization function
init();
