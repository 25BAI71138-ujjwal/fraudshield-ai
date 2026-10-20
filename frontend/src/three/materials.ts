import * as THREE from 'three';

export type MaterialTheme = 'synapse' | 'sapphire' | 'emerald' | 'amber' | 'rose' | 'ice' | 'chrome';

export interface ThemeConfig {
  id: MaterialTheme;
  name: string;
  badge: string;
  glassColor: number;
  attenuationColor: number;
  keyColor: number;
  roughness: number;
  metalness: number;
  transmission: number;
  ior: number;
  clearcoat: number;
  clearcoatRoughness: number;
  glowColor: string;
}

export const THEMES: Record<MaterialTheme, ThemeConfig> = {
  synapse: {
    id: 'synapse',
    name: 'Synapse Violet',
    badge: 'Scrolltide Synapse',
    glassColor: 0x9333ea,
    attenuationColor: 0x4c1d95,
    keyColor: 0x22d3ee,
    roughness: 0.05,
    metalness: 0.08,
    transmission: 0.68,
    ior: 1.58,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    glowColor: '#a855f7',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Crystal',
    badge: 'Original Pin',
    glassColor: 0x2266ff,
    attenuationColor: 0x1133bb,
    keyColor: 0x3b82f6,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.94,
    ior: 1.54,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    glowColor: '#3b82f6',
  },
  emerald: {
    id: 'emerald',
    name: 'Neon Emerald',
    badge: 'Cyber Crystal',
    glassColor: 0x05df96,
    attenuationColor: 0x008f5d,
    keyColor: 0x10b981,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.92,
    ior: 1.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    glowColor: '#10b981',
  },
  amber: {
    id: 'amber',
    name: 'Smoked Amber',
    badge: 'Luxury Glass',
    glassColor: 0xf59e0b,
    attenuationColor: 0xb45309,
    keyColor: 0xf59e0b,
    roughness: 0.06,
    metalness: 0.08,
    transmission: 0.90,
    ior: 1.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    glowColor: '#f59e0b',
  },
  rose: {
    id: 'rose',
    name: 'Rose Quartz',
    badge: 'Blush Gem',
    glassColor: 0xf43f5e,
    attenuationColor: 0xbe123c,
    keyColor: 0xf43f5e,
    roughness: 0.05,
    metalness: 0.04,
    transmission: 0.93,
    ior: 1.53,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    glowColor: '#f43f5e',
  },
  ice: {
    id: 'ice',
    name: 'Frosted Arctic',
    badge: 'Matte Glass',
    glassColor: 0xdbeafe,
    attenuationColor: 0x60a5fa,
    keyColor: 0x93c5fd,
    roughness: 0.28,
    metalness: 0.02,
    transmission: 0.88,
    ior: 1.48,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    glowColor: '#60a5fa',
  },
  chrome: {
    id: 'chrome',
    name: 'Liquid Titanium',
    badge: 'Mirror PBR',
    glassColor: 0xdde5ed,
    attenuationColor: 0x8892b0,
    keyColor: 0xc8d6e5,
    roughness: 0.08,
    metalness: 0.98,
    transmission: 0.0,
    ior: 2.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    glowColor: '#cbd5e1',
  },
};

export class MaterialManager {
  public lockBodyMaterial: THREE.MeshPhysicalMaterial;
  public shackleMaterial: THREE.MeshPhysicalMaterial;
  public keyMaterial: THREE.MeshPhysicalMaterial;

  // Mechanical interior materials
  public cylinderCoreMaterial: THREE.MeshStandardMaterial;
  public cylinderPlugMaterial: THREE.MeshStandardMaterial;
  public brassPinMaterial: THREE.MeshStandardMaterial;
  public driverPinMaterial: THREE.MeshStandardMaterial;
  public springMaterial: THREE.MeshStandardMaterial;
  public detentBearingMaterial: THREE.MeshStandardMaterial;
  public chromeRingMaterial: THREE.MeshStandardMaterial;

  private currentTheme: MaterialTheme = 'sapphire';

  constructor() {
    // Primary outer translucent glass body
    this.lockBodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9333ea,
      roughness: 0.05,
      metalness: 0.08,
      transmission: 0.68,
      thickness: 1.4,
      ior: 1.58,
      attenuationColor: new THREE.Color(0x4c1d95),
      attenuationDistance: 1.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 0.95,
      emissive: new THREE.Color(0x6b21a8),
      emissiveIntensity: 0.22,
      transparent: true,
      depthWrite: false, // Prevents inner mechanism clipping & flickering
    });

    // Shackle material (Solid polished chrome steel - high contrast & gleaming)
    this.shackleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.10,
      metalness: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      transmission: 0.0,
      transparent: false,
      depthWrite: true,
    });

    // Key material (Metallic cyan alloy)
    this.keyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee,
      roughness: 0.14,
      metalness: 0.90,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      transmission: 0.0,
      transparent: false,
      depthWrite: true,
    });

    // Interior cylinder lock housing (brushed satin titanium/steel)
    this.cylinderCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x7c8ba1,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Rotating plug with keyway slot (semi-polished gunmetal)
    this.cylinderPlugMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.28,
      metalness: 0.92,
    });

    // Key pins (lower pins - high polished brass)
    this.brassPinMaterial = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.18,
      metalness: 0.95,
    });

    // Driver pins (upper pins - stainless steel / nickel silver)
    this.driverPinMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.22,
      metalness: 0.92,
    });

    // Compression springs (coiled spring wire)
    this.springMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.9,
    });

    // Locking ball bearings / detent lugs
    this.detentBearingMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.1,
      metalness: 0.98,
    });

    // Chrome collar rings & top shackle bushings
    this.chromeRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.12,
      metalness: 0.96,
    });

    this.applyTheme('synapse');
  }

  public applyTheme(themeKey: MaterialTheme) {
    this.currentTheme = themeKey;
    const config = THEMES[themeKey];
    if (!config) return;

    if (themeKey === 'chrome') {
      // Liquid metal configuration
      this.lockBodyMaterial.color.setHex(config.glassColor);
      this.lockBodyMaterial.metalness = config.metalness;
      this.lockBodyMaterial.roughness = config.roughness;
      this.lockBodyMaterial.transmission = 0;
      this.lockBodyMaterial.transparent = false;
      this.lockBodyMaterial.depthWrite = true;

      this.shackleMaterial.color.setHex(0xe2e8f0);
      this.shackleMaterial.metalness = 0.98;
      this.shackleMaterial.roughness = 0.08;
      this.shackleMaterial.transmission = 0;
      this.shackleMaterial.transparent = false;
      this.shackleMaterial.depthWrite = true;

      this.keyMaterial.color.setHex(config.keyColor);
      this.keyMaterial.metalness = config.metalness;
      this.keyMaterial.roughness = config.roughness;
      this.keyMaterial.transmission = 0;
      this.keyMaterial.transparent = false;
      this.keyMaterial.depthWrite = true;
    } else {
      // Translucent glass configuration
      this.lockBodyMaterial.color.setHex(config.glassColor);
      this.lockBodyMaterial.attenuationColor.setHex(config.attenuationColor);
      this.lockBodyMaterial.metalness = config.metalness;
      this.lockBodyMaterial.roughness = config.roughness;
      this.lockBodyMaterial.transmission = config.transmission;
      this.lockBodyMaterial.ior = config.ior;
      this.lockBodyMaterial.clearcoat = config.clearcoat;
      this.lockBodyMaterial.clearcoatRoughness = config.clearcoatRoughness;
      this.lockBodyMaterial.emissive.setHex(config.glassColor);
      this.lockBodyMaterial.emissiveIntensity = 0.22;
      this.lockBodyMaterial.transparent = true;
      this.lockBodyMaterial.depthWrite = false;

      // Solid chrome steel shackle for maximum definition & realistic padlock look
      this.shackleMaterial.color.setHex(0xf8fafc);
      this.shackleMaterial.metalness = 0.96;
      this.shackleMaterial.roughness = 0.10;
      this.shackleMaterial.transmission = 0;
      this.shackleMaterial.transparent = false;
      this.shackleMaterial.depthWrite = true;

      // Solid metallic key
      this.keyMaterial.color.setHex(config.keyColor);
      this.keyMaterial.metalness = 0.90;
      this.keyMaterial.roughness = 0.14;
      this.keyMaterial.transmission = 0;
      this.keyMaterial.transparent = false;
      this.keyMaterial.depthWrite = true;
    }

    this.lockBodyMaterial.needsUpdate = true;
    this.shackleMaterial.needsUpdate = true;
    this.keyMaterial.needsUpdate = true;
  }

  public getTheme(): MaterialTheme {
    return this.currentTheme;
  }

  public dispose() {
    this.lockBodyMaterial.dispose();
    this.shackleMaterial.dispose();
    this.keyMaterial.dispose();
    this.cylinderCoreMaterial.dispose();
    this.cylinderPlugMaterial.dispose();
    this.brassPinMaterial.dispose();
    this.driverPinMaterial.dispose();
    this.springMaterial.dispose();
    this.detentBearingMaterial.dispose();
    this.chromeRingMaterial.dispose();
  }
}
