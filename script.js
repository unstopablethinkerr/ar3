const video = document.getElementById('camera-feed');
const handFrame = document.getElementById('hand-frame');
const greenFlash = document.getElementById('green-flash');

// Initialize MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
});

hands.onResults(onResults);

// Access the back camera and initialize the video stream
navigator.mediaDevices
  .getUserMedia({
    video: {
      facingMode: { exact: 'environment' }, // Force the back camera
    },
  })
  .then((stream) => {
    video.srcObject = stream;

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 1280,
      height: 720,
    });

    camera.start();
  })
  .catch((err) => {
    console.error('Error accessing the camera:', err);
  });

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const handLandmarks = results.multiHandLandmarks[0];

    const xCoords = handLandmarks.map((point) => point.x);
    const yCoords = handLandmarks.map((point) => point.y);

    const xMin = Math.min(...xCoords) * video.offsetWidth;
    const yMin = Math.min(...yCoords) * video.offsetHeight;
    const xMax = Math.max(...xCoords) * video.offsetWidth;
    const yMax = Math.max(...yCoords) * video.offsetHeight;

    const width = xMax - xMin;
    const height = yMax - yMin;

    handFrame.style.display = 'block';
    handFrame.style.left = `${xMin}px`;
    handFrame.style.top = `${yMin}px`;
    handFrame.style.width = `${width}px`;
    handFrame.style.height = `${height}px`;

    greenFlash.style.display = 'block';
    setTimeout(() => {
      greenFlash.style.display = 'none';
    }, 100);
  } else {
    handFrame.style.display = 'none';
    greenFlash.style.display = 'none';
  }
}
