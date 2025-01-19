const video = document.getElementById('camera-feed');
const handFrame = document.getElementById('hand-frame');
const greenFlash = document.getElementById('green-flash');

// Initialize MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1, // Track one hand
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
});

// Add the detection results callback
hands.onResults(onResults);

// Access the back camera and initialize the video stream
navigator.mediaDevices
  .getUserMedia({
    video: {
      facingMode: { ideal: 'environment' }, // Use back camera
      width: 1280,
      height: 720,
    },
  })
  .then((stream) => {
    video.srcObject = stream;
    video.play();

    // Process video frames with MediaPipe Hands
    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 1280,
      height: 720,
      flipHorizontal: false, // Do not flip for back camera
    });

    camera.start();
  })
  .catch((err) => {
    console.error('Error accessing the camera:', err);
  });

/**
 * Callback to handle results from MediaPipe Hands
 * @param {Object} results - The detection results
 */
function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    // Extract hand landmarks
    const handLandmarks = results.multiHandLandmarks[0];

    // Calculate bounding box based on video element dimensions
    const xCoords = handLandmarks.map((point) => point.x);
    const yCoords = handLandmarks.map((point) => point.y);

    const xMin = Math.min(...xCoords) * video.offsetWidth;
    const yMin = Math.min(...yCoords) * video.offsetHeight;
    const xMax = Math.max(...xCoords) * video.offsetWidth;
    const yMax = Math.max(...yCoords) * video.offsetHeight;

    const width = xMax - xMin;
    const height = yMax - yMin;

    // Update the bounding box position and size
    handFrame.style.display = 'block';
    handFrame.style.left = `${xMin}px`;
    handFrame.style.top = `${yMin}px`;
    handFrame.style.width = `${width}px`;
    handFrame.style.height = `${height}px`;

    // Flash the green border
    greenFlash.style.display = 'block';
    setTimeout(() => {
      greenFlash.style.display = 'none';
    }, 100); // Flash duration (ms)
  } else {
    // Hide the bounding box and green flash if no hand is detected
    handFrame.style.display = 'none';
    greenFlash.style.display = 'none';
  }
}
