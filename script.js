// script.js

// Load Handtrack.js model
const modelParams = {
  flipHorizontal: true, // Mirror the video feed
  maxNumBoxes: 1, // Detect only one hand
  iouThreshold: 0.5, // Intersection over union threshold
  scoreThreshold: 0.7, // Confidence threshold
};

let model;

// Function to get the rear camera
async function getRearCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const rearCamera = devices.find(
    (device) =>
      device.kind === 'videoinput' && device.label.toLowerCase().includes('back')
  );
  return rearCamera;
}

// Function to start the rear camera
async function startRearCamera() {
  const rearCamera = await getRearCamera();
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
  const video = document.querySelector('video');
  if (video) {
    video.srcObject = stream;
  } else {
    console.error('Video element not found.');
  }
}

// Function to detect hands and gestures
async function detectHands() {
  const video = document.querySelector('video');
  const borderHighlight = document.getElementById('border-highlight');
  const gestureBox = document.getElementById('gesture-box');

  setInterval(async () => {
    const predictions = await model.detect(video);
    if (predictions.length > 0) {
      // Hand detected
      borderHighlight.setAttribute('visible', true);
      gestureBox.setAttribute('visible', true);

      // Recognize gesture
      const gesture = recognizeGesture(predictions);
      gestureBox.setAttribute(
        'text',
        `value: ${gesture}; align: center; width: 4; color: white`
      );
    } else {
      // No hand detected
      borderHighlight.setAttribute('visible', false);
      gestureBox.setAttribute('visible', false);
    }
  }, 100); // Adjust detection frequency
}

// Function to recognize gestures
function recognizeGesture(predictions) {
  if (predictions.length > 0) {
    const hand = predictions[0];
    const fingersUp = countFingers(hand.landmarks); // Custom function to count fingers

    if (fingersUp === 1) {
      return 'Thumbs Up';
    } else if (fingersUp === 2) {
      return 'Peace Sign';
    } else if (fingersUp === 5) {
      return 'Open Hand';
    } else {
      return 'Hand Detected';
    }
  }
  return 'No Gesture';
}

// Function to count fingers (placeholder logic)
function countFingers(landmarks) {
  // Implement logic to count fingers based on hand landmarks
  // For now, return a random number for demonstration
  return Math.floor(Math.random() * 6); // Random number between 0 and 5
}

// Initialize the app
async function init() {
  // Load Handtrack.js model
  model = await handTrack.load(modelParams);

  // Start the rear camera
  await startRearCamera();

  // Start hand detection
  detectHands();
}

// Initialize the app
init();
