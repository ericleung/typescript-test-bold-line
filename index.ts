import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 基础对象
let width: number;
let height: number;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let wrapper: HTMLElement;

let centerX: number;
let centerY: number;

// 射线检测对象
let raycaster: THREE.Raycaster;

let controls: OrbitControls;

const initThree = () => {
  wrapper = document.getElementById('canvas_wrapper')!;
  //width = document.getElementById("main")!.clientWidth;
  //height = document.getElementById("main")!.clientHeight;

  width = window.innerWidth;
  height = window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setClearColor(0xf0f0f0, 1.0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.sortObjects = false;

  wrapper.appendChild(renderer.domElement);

  //
  raycaster = new THREE.Raycaster();
};

const initCamera = () => {
  camera = new THREE.PerspectiveCamera(75, width / height, 1, 2000);
  camera.position.x = 0;
  camera.position.y = 400;
  camera.position.z = -320;

  // 看向
  camera.lookAt(0, 0, 0);
};

const initScene = () => {
  scene = new THREE.Scene();
};

const initLight = () => {
  const directionalLight = new THREE.DirectionalLight('#bdbdbd', 3);
  directionalLight.position.set(-250, 300, -250);

  directionalLight.castShadow = true;

  directionalLight.shadow.mapSize.set(1024, 1024);

  directionalLight.shadow.camera.lookAt(new THREE.Vector3(0, 0, 0));
  directionalLight.shadow.camera.far = 800;
  directionalLight.shadow.camera.left = -200;
  directionalLight.shadow.camera.right = 200;
  directionalLight.shadow.camera.top = 200;
  directionalLight.shadow.camera.bottom = -200;

  scene.add(directionalLight);

  // const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
  // scene.add(directionalLightHelper);

  // const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
  // scene.add(directionalLightCameraHelper);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);
};

const makeBoldLine = (points: THREE.Vector2[], lineWidth: number) => {
  const len = points.length;
  if (len < 2) {
    return;
  }

  // 挤压线条，获取顶点
  const extrudePoints = extrude(points, lineWidth);

  // 顶点集合
  const vertices: number[] = [];
  // 顶点索引
  const indexes: number[] = [];

  // 以线段挤压出的四边形为单位，构建顶点集合、顶点索引
  const len1 = points.length - 1;
  for (let i = 0; i < len1; i++) {
    //四边形的4个顶点
    const pi = i * 2;
    const [A1, A2, B1, B2] = [
      extrudePoints[pi],
      extrudePoints[pi + 1],
      extrudePoints[pi + 2],
      extrudePoints[pi + 3],
    ];
    vertices.push(A1.x, A1.y, A2.x, A2.y, B1.x, B1.y, B2.x, B2.y);
    // 顶点索引
    const A1i = i * 4;
    const A2i = A1i + 1;
    const B1i = A1i + 2;
    const B2i = A1i + 3;
    indexes.push(A1i, A2i, B1i, B1i, A2i, B2i);
  }

  // const vertices = new Float32Array(vertices)
  // const indexes = new Uint16Array(indexes)

  return {
    vertices: new Float32Array(vertices),
    indexes: new Uint16Array(indexes),
    // indexes
  };
};

const extrude = (
  points: THREE.Vector2[],
  lineWidth: number
): THREE.Vector2[] => {
  //线宽的一半
  const h = lineWidth / 2;
  //顶点集合，挤压起始点置入其中
  const extrudePoints = [...verticalPoint(points[0], points[1], h)];
  // 挤压线条内部点，置入extrudePoints
  const len1 = points.length - 1;
  const len2 = len1 - 1;
  for (let i = 0; i < len2; i++) {
    // 三个点,两条线
    const A = points[i];
    const B = points[i + 1];
    const C = points[i + 2];
    // 两条线是否相交
    if (intersect(A, B, C)) {
      extrudePoints.push(...interPoint(A, B, C, h));
    } else {
      extrudePoints.push(...verticalPoint(B, C, h));
    }
  }
  // 挤压最后一个点
  extrudePoints.push(
    ...verticalPoint(points[len2], points[len1], h, points[len1])
  );
  return extrudePoints;
};

// 判断两条直线是否相交
const intersect = (A: THREE.Vector2, B: THREE.Vector2, C: THREE.Vector2) => {
  const angAB = B.clone().sub(A).angle();
  const angBC = C.clone().sub(B).angle();
  return !!((angAB - angBC) % Math.PI);
};

//垂直挤压点
const verticalPoint = (
  A: THREE.Vector2,
  B: THREE.Vector2,
  h: number,
  M = A
) => {
  const { x, y } = B.clone().sub(A);
  return [
    new THREE.Vector2(-y, x).setLength(h).add(M),
    new THREE.Vector2(y, -x).setLength(h).add(M),
  ];
};

// 拐点
const interPoint = (
  A: THREE.Vector2,
  B: THREE.Vector2,
  C: THREE.Vector2,
  h: number
) => {
  const d = B.clone().sub(A).normalize();
  const e = B.clone().sub(C).normalize();
  const b = d.clone().add(e).normalize();
  const BG = new THREE.Vector2(d.y, -d.x).setLength(h);
  const BGLen = BG.length();
  const cos = BG.clone().dot(b) / BGLen;
  const BB2 = b.setLength(BGLen / cos);
  const BB1 = BB2.clone().negate();
  return [BB1.add(B), BB2.add(B)];
};

const initObjects = () => {
  const result = makeBoldLine(
    [
      new THREE.Vector2(70.0, 10.0),
      new THREE.Vector2(40.0, 10.0),
      // new THREE.Vector2(-40, 40),
      // new THREE.Vector2(30, 40),
      // new THREE.Vector2(-30, -40),
      // new THREE.Vector2(40, -40),
      // new THREE.Vector2(40, 0),
      // new THREE.Vector2(70, 40)
    ],
    8
  );

  const geometry4 = new THREE.BufferGeometry();
  geometry4.setAttribute(
    'position',
    new THREE.BufferAttribute(result.vertices, 2)
  );
  geometry4.setIndex(new THREE.BufferAttribute(result.indexes, 1));
  // geometry4.computeVertexNormals();

  const mesh4 = new THREE.Mesh(
    geometry4,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0055FF'),
      side: THREE.DoubleSide,
    })
  );
  scene.add(mesh4);

  ////////////////////////////////////

  const geometry5 = new THREE.BufferGeometry();
  // 创建一个简单的矩形. 在这里我们左上和右下顶点被复制了两次。
  // 因为在两个三角面片里，这两个顶点都需要被用到。
  const vertices5 = new Float32Array([
    -100.0, -100.0, 100.0, 100.0, -100.0, 100.0, 100.0, 100.0, 100.0,

    100.0, 100.0, 100.0, -100.0, 100.0, 100.0, -100.0, -100.0, 100.0,
  ]);

  // itemSize = 3 因为每个顶点都是一个三元组。
  geometry5.setAttribute('position', new THREE.BufferAttribute(vertices5, 3));
  const material5 = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
  });
  const mesh5 = new THREE.Mesh(geometry5, material5);

  scene.add(mesh5);
};

let u_time: { value: number } = {
  value: 0,
};
let u_size: { value: number } = {
  value: 100,
};

function initHelper() {
  const helper = new THREE.GridHelper(1000, 50, 0x0000ff, 0x808080);
  scene.add(helper);

  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);
}

function initControl() {
  controls = new OrbitControls(camera, renderer.domElement);
  // controls.addEventListener('change', render);
  controls.maxPolarAngle = Math.PI / 2;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableDamping = true;
  controls.maxDistance = 580;
  controls.minDistance = 50;
}

function onWindowResize() {
  // console.log('resize');

  centerX = window.innerWidth / 2;
  centerY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  width = window.innerWidth;
  height = window.innerHeight;
  renderer.setSize(width, height);
}

const animate = (time: number) => {
  requestAnimationFrame(animate);

  render(time);
  // stats.update();

  renderer.render(scene, camera);
};

const render = (time: number) => {
  time *= 0.01;

  controls.update();

  camera.updateProjectionMatrix();
};

let mouseDown = false;
let mouseX = 0;
let mouxeY = 0;

const onMouseDown = (event: PointerEvent) => {
  event.preventDefault();
  mouseDown = true;
  mouseX = event.clientX;
  mouxeY = event.clientY;
};

const onMouseUp = (event: PointerEvent) => {
  event.preventDefault();
  mouseDown = false;
};

const onMouseMove = (event: PointerEvent) => {
  event.preventDefault();
  if (!mouseDown) {
    return;
  }

  // const deltaX = event.clientX - mouseX;
  // const deltaY = event.clientY - mouxeY;

  //console.log('deltaX:', deltaX);

  // const degY = -deltaX / 279;
  // const degX = -deltaY / 279;
  //deg 设置模型旋转的弧度
  // camera.up = new THREE.Vector3(0, 1, 0);
  // camera.rotation.y += degY;
  // camera.rotation.x += degX;

  mouseX = event.clientX;
  mouxeY = event.clientY;
};

(() => {
  console.log('onLoad');
  initThree();
  // initStats();
  initCamera();
  initScene();
  initLight();

  initObjects();

  initHelper();
  initControl();

  animate(0);

  window.addEventListener('resize', onWindowResize);

  document.addEventListener('pointerdown', onMouseDown, false);
  document.addEventListener('pointerup', onMouseUp, false);
  document.addEventListener('pointermove', onMouseMove, false);
})();
