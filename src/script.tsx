import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import GUI from "lil-gui";

console.log("Hello, Three.js with TypeScript!");

// ----- Setup Scene -----
const scene = new THREE.Scene();

// ----- Setup Canvas -----
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// ----- Setup Axes Helper -----
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// ----- Create Object -----
function createButterflyGeometry(steps: number, hsl: {h: number, s: number, l: number} ) {
    const pointsLeft: number[] = [];
    const pointsRight: number[] = [];
    const colors: number[] = [] 
    const { h, s, l } = hsl;

    for (let i = 0; i < steps; i++) {
        const t = (i / steps) * 24 * Math.PI;
        const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
        
        // Butterfly curve formula
        const x = r * Math.sin(t);
        const y = r * Math.cos(t);
        const z = Math.sin(2 * t) * 0.5;

        pointsLeft.push(x, y, z);
        pointsRight.push(-x, y, z);

        // Color gradient based on position
        const pct = i / steps;

        const color = new THREE.Color();
        color.setHSL(
            (h - 0.3 * pct + 1) % 1,
            s,
            l * pct
        );
        colors.push(color.r, color.g, color.b);
    }

    const verticesLeft = new Float32Array(pointsLeft);
    const verticesRight = new Float32Array(pointsRight);
    const colorAttr = new Float32Array(colors);

    const attributeLeft = new THREE.BufferAttribute(verticesLeft, 3);
    const attributeRight = new THREE.BufferAttribute(verticesRight, 3);
    const colorAttribute = new THREE.BufferAttribute(colorAttr, 3);

    const geometryLeft = new THREE.BufferGeometry();
    const geometryRight = new THREE.BufferGeometry();

    geometryLeft.setAttribute("position", attributeLeft);
    geometryRight.setAttribute("position", attributeRight);
    geometryLeft.setAttribute("color", colorAttribute);
    geometryRight.setAttribute("color", colorAttribute);
    
    return { geometryLeft, geometryRight };
}

const { geometryLeft, geometryRight } = createButterflyGeometry(2000,  {h: 0.85, s: 0.8, l: 0.5});

const materialButterfly = new THREE.PointsMaterial({ vertexColors: true, size: 0.01 });

const wingLeft = new THREE.Points(geometryLeft, materialButterfly);
const wingRight = new THREE.Line(geometryRight, materialButterfly);

const butterfly = new THREE.Group();
butterfly.add(wingLeft, wingRight);
scene.add(butterfly);

// ----- Setup Camera -----
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.set(0, 0, 5);
scene.add(camera);

// ----- Resize -----
window.addEventListener("resize", () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);

})

// ----- Controls -----
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;

// ----- Setup Renderer -----
const renderer = new THREE.WebGLRenderer({ canvas : canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Set pixel Ratio

// ----- Animation -----
const rotateButterfly = gsap.to(butterfly.rotation, {
    y: "+=" + Math.PI * 2,
    duration: 10,
    ease: "none",
    repeat: -1,
    paused: true,
})

// ----- Render Loop -----
function animate() {
    // Update controls
    controls.update();

    // Renderer
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// ----- Debug UI -----
const gui = new GUI({
    title: "Debug UI",
    closeFolders: false,
})
gui.close();
gui.hide();

window.addEventListener("keydown", (event) => {
    if (event.key === "g") {
        gui.show(gui._hidden);
    }
})

const butterflyFolder = gui.addFolder("Butterfly Controls");

// GUI settings Definition
const butterflySettings = {
    rotate: false,
    steps: 2000,
    hsl : {
        h: 0.85,
        s: 0.8,
        l: 0.5
    }
}

function updateButterfly() {
    const {geometryLeft, geometryRight} = createButterflyGeometry(butterflySettings.steps, butterflySettings.hsl);

    wingLeft.geometry.dispose();
    wingRight.geometry.dispose();
    wingLeft.geometry = geometryLeft;
    wingRight.geometry = geometryRight;
}

// GUI Position
butterflyFolder.add(butterfly.position, "x").min(-3).max(3).step(0.01);
butterflyFolder.add(butterfly.position, "y").min(-3).max(3).step(0.01);
butterflyFolder.add(butterfly.position, "z").min(-3).max(3).step(0.01);


// GUI Steps
butterflyFolder
    .add(butterflySettings, "steps")
    .name("Steps")
    .min(100)
    .max(5000)
    .step(100)
    .onChange(() => updateButterfly())

// GUI Color
const colorControls = gui.addFolder("Color Controls");

colorControls.add(butterflySettings.hsl, "h").name("Hue").min(0).max(1).step(0.01).onChange(() => updateButterfly());
colorControls.add(butterflySettings.hsl, "s").name("Saturation").min(0).max(1).step(0.01).onChange(() => updateButterfly());    
colorControls.add(butterflySettings.hsl, "l").name("Lightness").min(0).max(1).step(0.01).onChange(() => updateButterfly());

// GUI Animation
butterflyFolder
    .add(butterflySettings, "rotate")
    .name("Rotate")
    .onChange(() => {
        if (butterflySettings.rotate) {
            rotateButterfly.play();
        } else {
            rotateButterfly.pause();
        }
    });