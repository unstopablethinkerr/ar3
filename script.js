// Modified and optimized script
const video = document.getElementById("camera");
const canvas = document.getElementById("gesture-overlay");
const ctx = canvas.getContext("2d");
const gestureName = document.getElementById("gesture-name");
const arContainer = document.getElementById("ar-container");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let scene, camera, renderer, shapes = [];
let selectedObject = null;

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

// Initialize Three.js scene
function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    arContainer.appendChild(renderer.domElement);

    camera.position.z = 5;

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize(); // Ensure proper lighting
    scene.add(directionalLight);

    loadShapes();
    animate();
}

// Load 3D shapes from raw GitHub links
function loadShapes() {
    const loader = new THREE.GLTFLoader();
    const shapeUrls = [
        'https://github.com/unstopablethinkerr/ar3/raw/refs/heads/main/shape1.glb',
        'https://github.com/unstopablethinkerr/ar3/raw/refs/heads/main/shape2.glb',
        'https://github.com/unstopablethinkerr/ar3/raw/refs/heads/main/shape3.glb'
    ];

    shapeUrls.forEach((url, index) => {
        loader.load(url, (gltf) => {
            const shape = gltf.scene;
            shape.position.set(index * 2 - 2, 0, -5); // Adjust z-position for better placement
            shape.scale.set(0.5, 0.5, 0.5); // Adjust scale for visibility
            shapes.push(shape);
            scene.add(shape);
        }, undefined, (error) => {
            console.error("Error loading 3D shape:", error);
        });
    });
}

// Animate the selected object
function animate() {
    requestAnimationFrame(animate);
    if (selectedObject) {
        selectedObject.rotation.y += 0.01;
        selectedObject.position.y = Math.sin(Date.now() * 0.002) * 0.5; // Small jump animation
    }
    renderer.render(scene, camera);
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

        if (gesture === "Pointing ☝️") {
            selectObject(landmarks);
        }
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
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];

    // Pointing: Index finger extended, other fingers curled
    const isPointing = indexTip[1] < middleTip[1];

    if (isPointing) return "Pointing ☝️";

    return "Unknown Gesture";
}

// Select object based on pointing gesture
function selectObject(landmarks) {
    const indexTip = landmarks[8];
    const screenX = indexTip[0] / video.videoWidth * window.innerWidth;
    const screenY = indexTip[1] / video.videoHeight * window.innerHeight;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (screenX / window.innerWidth) * 2 - 1;
    mouse.y = -(screenY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shapes, true); // Ensure child objects are included

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
    } else {
        selectedObject = null;
    }
}

// Initialize app
(async function init() {
    await setupCamera();
    const model = await loadHandposeModel();
    initThreeJS();
    detectGestures(model);
})();
