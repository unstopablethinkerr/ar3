// script.js
const video = document.getElementById('video');
const borderHighlight = document.getElementById('border-highlight');
const gestureBox = document.getElementById('gesture-box');

// Load the Handtrack.js model
const modelParams = {
  flipHorizontal: true, // Flip to mirror the video
  maxNumBoxes: 1, // Maximum number of hands to detect
  iouThreshold: 0.5, // Intersection over union threshold
  scoreThreshold: 0.7, // Confidence threshold
};

let model;

// Initialize the camera and model
async function init() {
  model = await handTrack.load(modelParams);
  startVideo();
  detectHands();
}

// Start the rear camera feed
function startVideo() {
  const constraints = {
    video: {
      facingMode: "environment" // Use the rear camera
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error("Error accessing the rear camera: ", err);
    });
}

// Detect hands and gestures
function detectHands() {
  setInterval(async () => {
    const predictions = await model.detect(video);
    if (predictions.length > 0) {
      // Hand detected
      borderHighlight.style.borderColor = 'green';
      gestureBox.style.display = 'block';
      gestureBox.textContent = 'Hand Detected'; // Update gesture name
    } else {
      // No hand detected
      borderHighlight.style.borderColor = 'transparent';
      gestureBox.style.display = 'none';
    }
  }, 100); // Adjust detection frequency for performance
}

// Initialize the app
init();
