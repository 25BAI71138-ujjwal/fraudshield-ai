import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MaterialManager, MaterialTheme } from './materials';
import { createLockAssembly, LockAssembly } from './proceduralLock';
import { audioSynth } from '../sound/audioSynth';

export type CameraPreset = 'hero' | 'front' | 'tumbler' | 'top' | 'exploded';

// Preallocated math helpers to eliminate GC allocations in render loop
const _vec3 = new THREE.Vector3();
const _targetCam = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export interface LockSceneOptions {
  onStateChange?: (state: {
    isUnlocked: boolean;
    isInserted: boolean;
    keyInsertRatio: number;
    keyRotateRatio: number;
    explodedRatio: number;
    isAutoLooping: boolean;
  }) => void;
  isMouseDriven?: boolean;
  isAutoLooping?: boolean;
}

export class LockScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  public matMgr: MaterialManager;
  public assembly: LockAssembly;

  // Kinematic Targets & Current States
  public targetKeyInsert: number = 0.0; // 0 = out, 1 = fully inserted
  public currentKeyInsert: number = 0.0;

  public targetKeyRotate: number = 0.0; // 0 = 0 deg, 1 = 90 deg turned
  public currentKeyRotate: number = 0.0;

  public targetShacklePop: number = 0.0; // 0 = locked, 1 = popped open
  public currentShacklePop: number = 0.0;

  public targetShackleSwing: number = 0.0; // 0 = straight, 1 = swung open ~40 deg
  public currentShackleSwing: number = 0.0;

  public targetExploded: number = 0.0; // 0 = solid, 1 = exploded
  public currentExploded: number = 0.0;

  // Mode & Flags: Mouse driven only (no extra features, moves only on mouse move)
  public isMouseDriven: boolean = true;
  public isAutoLooping: boolean = false;
  private autoLoopTimer: number = 0;
  private isPerformingSequence: boolean = false;

  // Parallax & Smooth Tracking
  private mouseNormX: number = 0;
  private mouseNormY: number = 0;
  private baseCameraPos: THREE.Vector3 = new THREE.Vector3(0.0, 0.45, 5.3);
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3(0.0, 0.45, 5.3);
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0.15, 0);

  // Sound triggering trackers
  private lastInsertedState: boolean = false;
  private lastTurnSoundState: boolean = false;
  private lastUnlockedState: boolean = false;

  private callbacks: LockSceneOptions;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, options: LockSceneOptions = {}) {
    this.container = container;
    this.callbacks = options;
    this.isMouseDriven = options.isMouseDriven ?? true;
    this.isAutoLooping = options.isAutoLooping ?? false;

    // 1. Scene & Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07080a);
    this.scene.fog = new THREE.FogExp2(0x07080a, 0.025);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.copy(this.baseCameraPos);

    // 3. Renderer with ACES ToneMapping & SRGB
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Procedural Studio Environment (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    pmremGenerator.dispose();

    // 5. Materials & Model
    this.matMgr = new MaterialManager();
    this.assembly = createLockAssembly(this.matMgr);
    this.scene.add(this.assembly.rootGroup);

    // 6. Studio Lighting Rig
    this.setupLighting();

    // 7. Contact Shadow Grounding
    this.setupContactShadow();

    // 8. OrbitControls (only active for manual debugging if not mouse-driven)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    if (this.isMouseDriven) {
      this.controls.enableRotate = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
    }
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 14.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15;
    this.controls.target.copy(this.targetLookAt);

    // 9. Events & Animation Loop
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('pointermove', this.onGlobalPointerMove, { passive: true });
    this.resizeObserver = new ResizeObserver(() => {
      this.onWindowResize();
    });
    this.resizeObserver.observe(container);

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    // Pre-warm WebGL shader pipeline
    this.renderer.compile(this.scene, this.camera);

    this.animate();
  }

  private setupLighting() {
    // Warm Key Light (Direct illumination on lock front)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.8);
    keyLight.position.set(4, 6, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.015;
    this.scene.add(keyLight);

    // Synapse Violet Rim Light (Gives edges strong violet glow definition)
    const rimLight = new THREE.DirectionalLight(0xa855f7, 4.5);
    rimLight.position.set(-4, 3, -4);
    this.scene.add(rimLight);

    // Cyan Horizon Fill (Contrasting cyan glow on lower curves)
    const fillLight = new THREE.DirectionalLight(0x22d3ee, 2.5);
    fillLight.position.set(-3, 2, 3);
    this.scene.add(fillLight);

    // Top Overhead Light (Highlights polished chrome shackle arch)
    const topLight = new THREE.DirectionalLight(0xffffff, 2.8);
    topLight.position.set(0, 7, 2);
    this.scene.add(topLight);

    // Hemisphere Fill (Sky violet mist / Ground deep ink)
    const hemiLight = new THREE.HemisphereLight(0xe9d5ff, 0x07080a, 1.2);
    this.scene.add(hemiLight);
  }

  private setupContactShadow() {
    // Procedural soft radial gradient texture for realistic contact shadow
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(0.7, 'rgba(2, 6, 23, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.78;
    this.scene.add(shadowMesh);
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / (h || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /**
   * Tracks mouse movement across the viewport:
   * 1. 3D Parallax: tilts camera and rotates the lock body realistically to follow the cursor.
   * 2. Mechanical progression: cursor position scrubs the key sliding in, rotating 90 deg, and shackle popping.
   * 3. Animation occurs only when mouse moves!
   */
  private onGlobalPointerMove = (event: PointerEvent) => {
    if (!this.isMouseDriven || this.isPerformingSequence) return;

    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const normX = THREE.MathUtils.clamp(event.clientX / w, 0, 1);
    const normY = THREE.MathUtils.clamp(event.clientY / h, 0, 1);

    this.mouseNormX = normX * 2 - 1;
    this.mouseNormY = normY * 2 - 1;

    // Smooth mechanical mapping across horizontal mouse coordinate
    const animProgress = THREE.MathUtils.clamp((normX - 0.10) / 0.80, 0, 1);

    if (animProgress < 0.38) {
      // Stage 1: Key glides into cylinder tumbler [0 -> 1]
      this.targetKeyInsert = animProgress / 0.38;
      this.targetKeyRotate = 0;
      this.targetShacklePop = 0;
      this.targetShackleSwing = 0;
    } else if (animProgress < 0.68) {
      // Stage 2: Key is seated and rotates 90 degrees [0 -> 1]
      this.targetKeyInsert = 1.0;
      this.targetKeyRotate = (animProgress - 0.38) / 0.30;
      this.targetShacklePop = 0;
      this.targetShackleSwing = 0;
    } else {
      // Stage 3: Key is turned, shackle springs upward and swings open [0 -> 1]
      this.targetKeyInsert = 1.0;
      this.targetKeyRotate = 1.0;
      const shackleFactor = (animProgress - 0.68) / 0.32;
      this.targetShacklePop = Math.min(1.0, shackleFactor * 1.5);
      this.targetShackleSwing = shackleFactor;
    }

    // Audio triggers
    const isInserted = this.targetKeyInsert > 0.95;
    if (isInserted && !this.lastInsertedState) {
      audioSynth.playKeyInsertSeat();
      this.lastInsertedState = true;
    } else if (!isInserted && this.lastInsertedState) {
      this.lastInsertedState = false;
    }

    const isTurned = this.targetKeyRotate > 0.85;
    if (isTurned && !this.lastTurnSoundState) {
      audioSynth.playKeyTurn();
      this.lastTurnSoundState = true;
    } else if (!isTurned && this.lastTurnSoundState) {
      this.lastTurnSoundState = false;
    }

    const isUnlocked = this.targetShacklePop > 0.75;
    if (isUnlocked && !this.lastUnlockedState) {
      audioSynth.playUnlockPop();
      this.lastUnlockedState = true;
    } else if (!isUnlocked && this.lastUnlockedState) {
      audioSynth.playLockShut();
      this.lastUnlockedState = false;
    }
  };

  private onPointerDown = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([
      this.assembly.keyGroup,
      this.assembly.shackleMesh,
      this.assembly.bodyShellFront,
    ], true);

    if (intersects.length > 0) {
      // User interacted directly with the 3D model!
      this.isAutoLooping = false; // Switch to manual control
      this.toggleLockState();
    }
  };

  public toggleLockState() {
    if (this.targetShacklePop > 0.5) {
      // Currently unlocked -> Lock it!
      this.targetShackleSwing = 0;
      setTimeout(() => {
        this.targetShacklePop = 0;
        audioSynth.playLockShut();
      }, 200);
      setTimeout(() => {
        this.targetKeyRotate = 0;
        audioSynth.playKeyTurn();
      }, 450);
      setTimeout(() => {
        this.targetKeyInsert = 0;
        audioSynth.playKeySlide();
      }, 700);
    } else {
      // Currently locked -> Unlock it!
      this.targetKeyInsert = 1.0;
      audioSynth.playKeySlide();
      setTimeout(() => {
        audioSynth.playKeyInsertSeat();
        this.targetKeyRotate = 1.0;
        audioSynth.playKeyTurn();
      }, 400);
      setTimeout(() => {
        this.targetShacklePop = 1.0;
        this.targetShackleSwing = 1.0;
        audioSynth.playUnlockPop();
      }, 750);
    }
  }

  /**
   * Smooth lock-in sequence specifically designed for login authorization:
   * 1. Key aligns and slides smoothly into cylinder
   * 2. Key seats and turns with mechanical precision
   * 3. Shackle pops and swings open to grant access
   * 4. Fires callback right after animation completes so login transition is perfectly smooth!
   */
  public performLoginSequence(onComplete?: () => void) {
    this.isPerformingSequence = true;
    this.isAutoLooping = false;
    
    // Ensure starting from locked position
    this.targetShackleSwing = 0;
    this.targetShacklePop = 0;
    this.targetKeyRotate = 0;
    this.targetKeyInsert = 0;
    
    // Step 1: Key glides in smoothly
    setTimeout(() => {
      this.targetKeyInsert = 1.0;
      audioSynth.playKeySlide();
    }, 100);

    // Step 2: Key seats and turns
    setTimeout(() => {
      audioSynth.playKeyInsertSeat();
      this.targetKeyRotate = 1.0;
      audioSynth.playKeyTurn();
    }, 550);

    // Step 3: Mechanical shackle release & spring pop
    setTimeout(() => {
      this.targetShacklePop = 1.0;
      this.targetShackleSwing = 1.0;
      audioSynth.playUnlockPop();
    }, 1000);

    // Step 4: Callback right after smooth motion settles
    setTimeout(() => {
      this.isPerformingSequence = false;
      if (onComplete) onComplete();
    }, 1450);
  }

  public performLockSequence(onComplete?: () => void) {
    this.isPerformingSequence = true;
    this.isAutoLooping = false;
    
    // Start from open state so the user visibly witnesses the locking motion
    this.targetKeyInsert = 1.0;
    this.targetKeyRotate = 1.0;
    this.targetShacklePop = 1.0;
    this.targetShackleSwing = 1.0;
    this.currentKeyInsert = 1.0;
    this.currentKeyRotate = 1.0;
    this.currentShacklePop = 1.0;
    this.currentShackleSwing = 1.0;

    // Step 1: Shackle swings shut into alignment with holes
    setTimeout(() => {
      this.targetShackleSwing = 0;
    }, 150);

    // Step 2: Shackle snaps down into the body with spring tension
    setTimeout(() => {
      this.targetShacklePop = 0;
      audioSynth.playLockShut();
    }, 650);

    // Step 3: Key rotates 90 degrees back to upright 0 position
    setTimeout(() => {
      this.targetKeyRotate = 0;
      audioSynth.playKeyTurn();
    }, 1100);

    // Step 4: Key glides back out of the keyway
    setTimeout(() => {
      this.targetKeyInsert = 0;
      audioSynth.playKeySlide();
    }, 1550);

    setTimeout(() => {
      this.isPerformingSequence = false;
      if (onComplete) onComplete();
    }, 2000);
  }

  public setAutoLoop(enable: boolean) {
    this.isAutoLooping = enable;
    if (enable) {
      this.autoLoopTimer = 0;
    }
  }

  public setKeyInsert(val: number) {
    this.isAutoLooping = false;
    this.targetKeyInsert = Math.max(0, Math.min(1, val));
    if (this.targetKeyInsert < 0.9 && this.targetKeyRotate > 0.1) {
      this.targetKeyRotate = 0;
    }
    if (this.targetKeyInsert < 0.9 && this.targetShacklePop > 0.1) {
      this.targetShacklePop = 0;
      this.targetShackleSwing = 0;
    }
  }

  public setKeyRotate(val: number) {
    this.isAutoLooping = false;
    this.targetKeyRotate = Math.max(0, Math.min(1, val));
    if (this.targetKeyRotate > 0.8 && this.targetKeyInsert > 0.9) {
      if (this.targetShacklePop < 0.5) {
        this.targetShacklePop = 1.0;
        this.targetShackleSwing = 1.0;
        audioSynth.playUnlockPop();
      }
    } else if (this.targetKeyRotate < 0.3) {
      if (this.targetShacklePop > 0.5) {
        this.targetShacklePop = 0.0;
        this.targetShackleSwing = 0.0;
        audioSynth.playLockShut();
      }
    }
  }

  public setExploded(val: number) {
    this.targetExploded = Math.max(0, Math.min(1, val));
  }

  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'hero': // 3/4 Perspective as in Pinterest video
        this.targetCameraPos.set(3.2, 1.8, 4.2);
        this.targetLookAt.set(0, 0.2, 0);
        break;
      case 'front': // Straight-on view into lock cylinder
        this.targetCameraPos.set(0, 0.1, 4.8);
        this.targetLookAt.set(0, 0, 0);
        break;
      case 'tumbler': // Close-up internal mechanism macro view
        this.targetCameraPos.set(1.4, 0.6, 2.2);
        this.targetLookAt.set(0, -0.3, 0);
        break;
      case 'top': // Overhead mechanical view
        this.targetCameraPos.set(0.1, 5.2, 0.1);
        this.targetLookAt.set(0, 0, 0);
        break;
      case 'exploded': // Wide architectural view
        this.targetCameraPos.set(4.5, 2.5, 5.5);
        this.targetLookAt.set(0, 0.2, 0);
        this.targetExploded = 0.85;
        break;
    }
  }

  public setTheme(theme: MaterialTheme) {
    this.matMgr.applyTheme(theme);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Auto-loop cinematic playback matching Pinterest video
    if (this.isAutoLooping) {
      this.autoLoopTimer += delta;
      const cycle = this.autoLoopTimer % 7.5;

      if (cycle < 1.0) {
        // State 0: Key enters
        this.targetKeyInsert = THREE.MathUtils.smoothstep(cycle, 0.1, 0.9);
        this.targetKeyRotate = 0;
        this.targetShacklePop = 0;
        this.targetShackleSwing = 0;
      } else if (cycle < 2.0) {
        // State 1: Key fully seated & turns
        this.targetKeyInsert = 1.0;
        this.targetKeyRotate = THREE.MathUtils.smoothstep(cycle, 1.1, 1.8);
        this.targetShacklePop = 0;
        this.targetShackleSwing = 0;
      } else if (cycle < 3.8) {
        // State 2: Lock springs open!
        this.targetKeyInsert = 1.0;
        this.targetKeyRotate = 1.0;
        this.targetShacklePop = THREE.MathUtils.smoothstep(cycle, 2.0, 2.3);
        this.targetShackleSwing = THREE.MathUtils.smoothstep(cycle, 2.3, 3.2);
      } else if (cycle < 4.8) {
        // State 3: Shackle swings closed & locks
        this.targetKeyInsert = 1.0;
        this.targetKeyRotate = 1.0;
        this.targetShackleSwing = 1.0 - THREE.MathUtils.smoothstep(cycle, 3.8, 4.3);
        this.targetShacklePop = 1.0 - THREE.MathUtils.smoothstep(cycle, 4.3, 4.7);
      } else if (cycle < 5.8) {
        // State 4: Key turns back to 0
        this.targetKeyInsert = 1.0;
        this.targetKeyRotate = 1.0 - THREE.MathUtils.smoothstep(cycle, 4.9, 5.6);
        this.targetShacklePop = 0;
        this.targetShackleSwing = 0;
      } else {
        // State 5: Key slides out to rest
        this.targetKeyRotate = 0;
        this.targetShacklePop = 0;
        this.targetShackleSwing = 0;
        this.targetKeyInsert = 1.0 - THREE.MathUtils.smoothstep(cycle, 5.9, 6.8);
      }
    }

    // Kinematics Exponential Damping
    const dampRate = 12.0;
    this.currentKeyInsert = THREE.MathUtils.damp(this.currentKeyInsert, this.targetKeyInsert, dampRate, delta);
    this.currentKeyRotate = THREE.MathUtils.damp(this.currentKeyRotate, this.targetKeyRotate, dampRate, delta);
    this.currentShacklePop = THREE.MathUtils.damp(this.currentShacklePop, this.targetShacklePop, dampRate * 1.5, delta);
    this.currentShackleSwing = THREE.MathUtils.damp(this.currentShackleSwing, this.targetShackleSwing, dampRate, delta);
    this.currentExploded = THREE.MathUtils.damp(this.currentExploded, this.targetExploded, 8.0, delta);

    // Apply Key transforms
    // Key Insertion along Z: from 2.5 (out) to 0.42 (inserted)
    const keyZ = THREE.MathUtils.lerp(2.5, 0.42, this.currentKeyInsert);
    // Key rotation around Z axis: 0 to Math.PI / 2
    const keyRot = this.currentKeyRotate * (Math.PI / 2);

    this.assembly.keyGroup.position.z = keyZ;
    this.assembly.keyGroup.rotation.z = keyRot;

    // Plug rotates in sync with key when key is inserted
    if (this.currentKeyInsert > 0.85) {
      this.assembly.rotatingPlug.rotation.z = keyRot;
    } else {
      this.assembly.rotatingPlug.rotation.z = 0;
    }

    // Tumbler pins movement: lifted by key insertion
    this.assembly.tumblerPins.forEach((pin, idx) => {
      // Pins lift when key blade slides under them
      const threshold = 0.3 + idx * 0.18;
      const liftFactor = THREE.MathUtils.clamp((this.currentKeyInsert - threshold) / 0.25, 0, 1);
      const targetY = pin.initialY + pin.liftHeight * liftFactor;
      pin.keyPin.position.y = targetY;
      pin.driverPin.position.y = targetY + 0.26;
      // Spring compresses
      pin.spring.scale.y = 1.0 - liftFactor * 0.45;
    });

    // Shackle movement:
    // When locked: Y = 0.95. When popped: Y = 1.55 (with slight spring overshoot when unlocked)
    const shackleY = THREE.MathUtils.lerp(0.95, 1.55, this.currentShacklePop);
    this.assembly.shackleGroup.position.y = shackleY;

    // Shackle swing open around left leg pivot
    // We pivot around left leg X = -0.72
    const swingRad = this.currentShackleSwing * 0.7; // ~40 degrees
    this.assembly.shackleGroup.rotation.y = swingRad;
    this.assembly.shackleGroup.position.x = -0.72 + 0.72 * Math.cos(swingRad);
    this.assembly.shackleGroup.position.z = -0.72 * Math.sin(swingRad);

    // Exploded View transforms
    const exp = this.currentExploded;
    this.assembly.bodyShellFront.position.z = 0.35 + exp * 1.8;
    this.assembly.bodyShellBack.position.z = -0.35 - exp * 1.8;
    this.assembly.bodyCoreBezel.position.z = 0.72 + exp * 2.2;
    this.assembly.shackleLeftBush.position.y = 0.95 + exp * 0.7;
    this.assembly.shackleRightBush.position.y = 0.95 + exp * 0.7;
    this.assembly.detentBallLeft.position.x = -0.52 - exp * 0.9;
    this.assembly.detentBallRight.position.x = 0.52 + exp * 0.9;

    // Smooth camera damping to preset
    if (this.isMouseDriven && !this.isPerformingSequence) {
      this.targetCameraPos.set(
        this.baseCameraPos.x + this.mouseNormX * 1.6,
        this.baseCameraPos.y - this.mouseNormY * 1.0,
        this.baseCameraPos.z + Math.abs(this.mouseNormX) * 0.45
      );
      this.assembly.rootGroup.rotation.y = this.mouseNormX * 0.40;
      this.assembly.rootGroup.rotation.x = -this.mouseNormY * 0.20;
    }

    this.camera.position.lerp(this.targetCameraPos, delta * 3.5);
    _targetCam.copy(this.targetLookAt);
    this.controls.target.lerp(_targetCam, delta * 3.5);
    this.controls.update();

    // Audio triggers check in auto loop
    const isNowInserted = this.currentKeyInsert > 0.95;
    if (isNowInserted !== this.lastInsertedState) {
      if (isNowInserted) audioSynth.playKeyInsertSeat();
      this.lastInsertedState = isNowInserted;
    }

    const isNowUnlocked = this.currentShacklePop > 0.85;
    if (isNowUnlocked !== this.lastUnlockedState) {
      if (isNowUnlocked) audioSynth.playUnlockPop();
      this.lastUnlockedState = isNowUnlocked;
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Callbacks to React HUD
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({
        isUnlocked: this.currentShacklePop > 0.5,
        isInserted: this.currentKeyInsert > 0.5,
        keyInsertRatio: this.currentKeyInsert,
        keyRotateRatio: this.currentKeyRotate,
        explodedRatio: this.currentExploded,
        isAutoLooping: this.isAutoLooping,
      });
    }
  };

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('pointermove', this.onGlobalPointerMove);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.controls.dispose();
    this.matMgr.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
