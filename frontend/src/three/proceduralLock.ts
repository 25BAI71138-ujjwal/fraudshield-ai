import * as THREE from 'three';
import { MaterialManager } from './materials';

export interface LockAssembly {
  rootGroup: THREE.Group;
  bodyShellFront: THREE.Mesh;
  bodyShellBack: THREE.Mesh;
  bodyCoreBezel: THREE.Mesh;
  shackleGroup: THREE.Group;
  shackleMesh: THREE.Mesh;
  shackleLeftBush: THREE.Mesh;
  shackleRightBush: THREE.Mesh;
  cylinderHousing: THREE.Group;
  rotatingPlug: THREE.Group;
  keyGroup: THREE.Group;
  tumblerPins: {
    keyPin: THREE.Mesh;
    driverPin: THREE.Mesh;
    spring: THREE.Mesh;
    initialY: number;
    liftHeight: number;
  }[];
  detentBallLeft: THREE.Mesh;
  detentBallRight: THREE.Mesh;
}

export function createLockAssembly(matMgr: MaterialManager): LockAssembly {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'LockRoot';

  // -------------------------------------------------------------
  // 1. PADLOCK BODY SHELLS (Glassmorphic Front & Back Shells)
  // -------------------------------------------------------------
  // Body dimensions: width 2.6, height 2.5, depth ~1.2 (0.6 each half)
  const bodyShape = new THREE.Shape();
  const w = 1.3;
  const h = 1.25;
  const rBottom = 0.65;
  const rTop = 0.25;

  // Draw smooth rounded padlock body contour
  bodyShape.moveTo(-w + rTop, h);
  bodyShape.lineTo(w - rTop, h);
  bodyShape.quadraticCurveTo(w, h, w, h - rTop);
  bodyShape.lineTo(w, -h + rBottom);
  bodyShape.quadraticCurveTo(w, -h, w - rBottom, -h);
  bodyShape.lineTo(-w + rBottom, -h);
  bodyShape.quadraticCurveTo(-w, -h, -w, -h + rBottom);
  bodyShape.lineTo(-w, h - rTop);
  bodyShape.quadraticCurveTo(-w, h, -w + rTop, h);

  // Escutcheon keyhole circular cutout for front face
  const escutcheonHole = new THREE.Path();
  const keyholeR = 0.48;
  escutcheonHole.absarc(0, -0.15, keyholeR, 0, Math.PI * 2, true);
  bodyShape.holes.push(escutcheonHole);

  const extrudeSettingsFront: THREE.ExtrudeGeometryOptions = {
    steps: 2,
    depth: 0.55,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelOffset: 0,
    bevelSegments: 8,
  };

  const frontGeom = new THREE.ExtrudeGeometry(bodyShape, extrudeSettingsFront);
  frontGeom.center();
  const bodyShellFront = new THREE.Mesh(frontGeom, matMgr.lockBodyMaterial);
  bodyShellFront.position.set(0, -0.2, 0.35);
  bodyShellFront.castShadow = true;
  bodyShellFront.receiveShadow = true;
  rootGroup.add(bodyShellFront);

  // Back shell without keyhole cutout
  const backShape = new THREE.Shape();
  backShape.moveTo(-w + rTop, h);
  backShape.lineTo(w - rTop, h);
  backShape.quadraticCurveTo(w, h, w, h - rTop);
  backShape.lineTo(w, -h + rBottom);
  backShape.quadraticCurveTo(w, -h, w - rBottom, -h);
  backShape.lineTo(-w + rBottom, -h);
  backShape.quadraticCurveTo(-w, -h, -w, -h + rBottom);
  backShape.lineTo(-w, h - rTop);
  backShape.quadraticCurveTo(-w, h, -w + rTop, h);

  const backGeom = new THREE.ExtrudeGeometry(backShape, extrudeSettingsFront);
  backGeom.center();
  const bodyShellBack = new THREE.Mesh(backGeom, matMgr.lockBodyMaterial);
  bodyShellBack.position.set(0, -0.2, -0.35);
  bodyShellBack.rotation.y = Math.PI;
  bodyShellBack.castShadow = true;
  bodyShellBack.receiveShadow = true;
  rootGroup.add(bodyShellBack);

  // Inner decorative bezel ring in keyhole
  const bezelGeom = new THREE.TorusGeometry(keyholeR, 0.05, 16, 48);
  const bodyCoreBezel = new THREE.Mesh(bezelGeom, matMgr.chromeRingMaterial);
  bodyCoreBezel.position.set(0, -0.35, 0.72);
  rootGroup.add(bodyCoreBezel);

  // -------------------------------------------------------------
  // 2. SHACKLE ASSEMBLY (U-shaped curved bar & collar bushings)
  // -------------------------------------------------------------
  const shackleGroup = new THREE.Group();
  shackleGroup.name = 'ShackleGroup';
  shackleGroup.position.set(0, 0.95, 0);

  // Build U-curve for shackle
  // Left leg: X = -0.72, Right leg: X = 0.72
  const shackleCurve = new THREE.CurvePath<THREE.Vector3>();
  const leftLeg = new THREE.LineCurve3(
    new THREE.Vector3(-0.72, -0.65, 0),
    new THREE.Vector3(-0.72, 0.85, 0)
  );
  // Arc at top
  const topArc = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.72, 0.85, 0),
    new THREE.Vector3(0, 1.6, 0),
    new THREE.Vector3(0.72, 0.85, 0)
  );
  // Shorter right leg (locks/unlocks free)
  const rightLeg = new THREE.LineCurve3(
    new THREE.Vector3(0.72, 0.85, 0),
    new THREE.Vector3(0.72, -0.25, 0)
  );

  shackleCurve.add(leftLeg);
  shackleCurve.add(topArc);
  shackleCurve.add(rightLeg);

  const shackleGeom = new THREE.TubeGeometry(shackleCurve, 64, 0.22, 24, false);
  const shackleMesh = new THREE.Mesh(shackleGeom, matMgr.shackleMaterial);
  shackleMesh.castShadow = true;
  shackleMesh.receiveShadow = true;
  shackleGroup.add(shackleMesh);

  // Shackle locking cutouts (notches on inner side of legs where detent balls catch)
  const notchGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
  const leftNotch = new THREE.Mesh(notchGeom, matMgr.chromeRingMaterial);
  leftNotch.rotation.z = Math.PI / 2;
  leftNotch.position.set(-0.54, -0.15, 0);
  shackleGroup.add(leftNotch);

  const rightNotch = new THREE.Mesh(notchGeom, matMgr.chromeRingMaterial);
  rightNotch.rotation.z = Math.PI / 2;
  rightNotch.position.set(0.54, -0.05, 0);
  shackleGroup.add(rightNotch);

  rootGroup.add(shackleGroup);

  // Top shackle chrome collar bushings attached to padlock body
  const bushGeom = new THREE.CylinderGeometry(0.32, 0.35, 0.2, 32);
  const shackleLeftBush = new THREE.Mesh(bushGeom, matMgr.chromeRingMaterial);
  shackleLeftBush.position.set(-0.72, 0.95, 0);
  rootGroup.add(shackleLeftBush);

  const shackleRightBush = new THREE.Mesh(bushGeom, matMgr.chromeRingMaterial);
  shackleRightBush.position.set(0.72, 0.95, 0);
  rootGroup.add(shackleRightBush);

  // -------------------------------------------------------------
  // 3. INTERNAL LOCK CYLINDER & MECHANICAL TUMBLER PINS
  // -------------------------------------------------------------
  const cylinderHousing = new THREE.Group();
  cylinderHousing.position.set(0, -0.35, 0);

  // Outer lock cylinder housing (titanium/steel core)
  const cylinderOuterGeom = new THREE.CylinderGeometry(0.52, 0.52, 1.1, 32, 1, true);
  cylinderOuterGeom.rotateX(Math.PI / 2);
  const cylinderOuterMesh = new THREE.Mesh(cylinderOuterGeom, matMgr.cylinderCoreMaterial);
  cylinderHousing.add(cylinderOuterMesh);

  // Rotating inner cylinder plug
  const rotatingPlug = new THREE.Group();
  rotatingPlug.position.set(0, 0, 0);

  const plugGeom = new THREE.CylinderGeometry(0.42, 0.42, 1.08, 32);
  plugGeom.rotateX(Math.PI / 2);
  const plugMesh = new THREE.Mesh(plugGeom, matMgr.cylinderPlugMaterial);
  rotatingPlug.add(plugMesh);

  // Keyway slot in the front face of the plug
  const keywayGeom = new THREE.BoxGeometry(0.09, 0.42, 0.9);
  const keywayMesh = new THREE.Mesh(keywayGeom, matMgr.cylinderCoreMaterial);
  keywayMesh.position.set(0, 0, 0.1);
  rotatingPlug.add(keywayMesh);

  // Cam / Tailpiece at back of plug
  const camGeom = new THREE.BoxGeometry(0.18, 0.55, 0.14);
  const camMesh = new THREE.Mesh(camGeom, matMgr.chromeRingMaterial);
  camMesh.position.set(0, 0.15, -0.52);
  rotatingPlug.add(camMesh);

  cylinderHousing.add(rotatingPlug);
  rootGroup.add(cylinderHousing);

  // 4 Pin Tumbler Columns (Lower Key Pins + Upper Driver Pins + Coiled Springs)
  const tumblerPins: LockAssembly['tumblerPins'] = [];
  const pinOffsetsZ = [0.32, 0.12, -0.08, -0.28];
  // Key cut depths (bittings) for the 4 pins
  const pinDepths = [0.14, 0.08, 0.18, 0.12];

  pinOffsetsZ.forEach((zPos, i) => {
    // Key pin (brass bullet shaped)
    const keyPinGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
    const keyPin = new THREE.Mesh(keyPinGeom, matMgr.brassPinMaterial);
    const initialKeyPinY = -0.12;
    keyPin.position.set(0, initialKeyPinY, zPos);
    rotatingPlug.add(keyPin);

    // Driver pin (steel flat-top cylinder)
    const driverPinGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.24, 16);
    const driverPin = new THREE.Mesh(driverPinGeom, matMgr.driverPinMaterial);
    const initialDriverPinY = 0.14;
    driverPin.position.set(0, initialDriverPinY, zPos);
    cylinderHousing.add(driverPin);

    // Micro spring above driver pin
    const springGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12, 6, true);
    const spring = new THREE.Mesh(springGeom, matMgr.springMaterial);
    spring.position.set(0, 0.38, zPos);
    cylinderHousing.add(spring);

    tumblerPins.push({
      keyPin,
      driverPin,
      spring,
      initialY: initialKeyPinY,
      liftHeight: pinDepths[i],
    });
  });

  // Locking detent bearings (engage with shackle)
  const detentGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const detentBallLeft = new THREE.Mesh(detentGeom, matMgr.detentBearingMaterial);
  detentBallLeft.position.set(-0.52, 0.78, 0);
  rootGroup.add(detentBallLeft);

  const detentBallRight = new THREE.Mesh(detentGeom, matMgr.detentBearingMaterial);
  detentBallRight.position.set(0.52, 0.88, 0);
  rootGroup.add(detentBallRight);

  // -------------------------------------------------------------
  // 4. THE GLASS KEY (Matching Pinterest Pin Aesthetic)
  // -------------------------------------------------------------
  // Clean translucent glass key with circular ring handle (O-ring bow)
  const keyGroup = new THREE.Group();
  keyGroup.name = 'KeyGroup';

  // Ring handle / Bow (outer radius 0.65, tube radius 0.11)
  const bowGeom = new THREE.TorusGeometry(0.55, 0.11, 24, 48);
  const keyBow = new THREE.Mesh(bowGeom, matMgr.keyMaterial);
  keyBow.position.set(0, 0, 1.8);
  keyGroup.add(keyBow);

  // Key collar connecting bow to stem
  const collarGeom = new THREE.CylinderGeometry(0.18, 0.14, 0.18, 24);
  collarGeom.rotateX(Math.PI / 2);
  const keyCollar = new THREE.Mesh(collarGeom, matMgr.keyMaterial);
  keyCollar.position.set(0, 0, 1.2);
  keyGroup.add(keyCollar);

  // Key stem / shaft
  const stemGeom = new THREE.CylinderGeometry(0.09, 0.09, 1.1, 24);
  stemGeom.rotateX(Math.PI / 2);
  const keyStem = new THREE.Mesh(stemGeom, matMgr.keyMaterial);
  keyStem.position.set(0, 0, 0.6);
  keyGroup.add(keyStem);

  // Key Blade with bitting profile matching the pin tumblers
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.04, 0);
  bladeShape.lineTo(0.04, -0.32);
  // Bittings / Cuts along blade edge
  bladeShape.lineTo(-0.25, -0.32);
  bladeShape.lineTo(-0.25 + pinDepths[3], -0.22);
  bladeShape.lineTo(-0.25 + pinDepths[2], -0.12);
  bladeShape.lineTo(-0.25 + pinDepths[1], -0.02);
  bladeShape.lineTo(-0.25 + pinDepths[0], 0.08);
  bladeShape.lineTo(0, 0.12);
  bladeShape.closePath();

  const bladeExtrude: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.82,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrude);
  bladeGeom.center();
  const keyBlade = new THREE.Mesh(bladeGeom, matMgr.keyMaterial);
  keyBlade.rotation.y = Math.PI / 2;
  keyBlade.position.set(0, -0.12, 0.45);
  keyGroup.add(keyBlade);

  // Initial key placement: in front of the keyhole ready to insert
  keyGroup.position.set(0, -0.35, 2.5);
  rootGroup.add(keyGroup);

  return {
    rootGroup,
    bodyShellFront,
    bodyShellBack,
    bodyCoreBezel,
    shackleGroup,
    shackleMesh,
    shackleLeftBush,
    shackleRightBush,
    cylinderHousing,
    rotatingPlug,
    keyGroup,
    tumblerPins,
    detentBallLeft,
    detentBallRight,
  };
}
