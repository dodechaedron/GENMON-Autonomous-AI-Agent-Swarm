"use client";
import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, ThreeEvent, extend, useThree } from "@react-three/fiber";
import { OrbitControls, Html, shaderMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useGenmonStore, GenmonAgent } from "@/store/useGenmonStore";

/* ═══════════════════════════════════════════════════════
   CUSTOM SHADERS
   ═══════════════════════════════════════════════════════ */

// Volumetric Glow — multi-layer fresnel with chromatic shift
const VolumetricGlowMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("#00FFFF"),
    uColor2: new THREE.Color("#BF00FF"),
    uIntensity: 1.0,
    uTime: 0,
    uOpacity: 1.0,
    uActive: 0.0,
  },
  /* vertex */
  `varying vec3 vNormal;
   varying vec3 vViewDir;
   varying vec3 vWorldPos;
   varying vec2 vUv;
   void main() {
     vUv = uv;
     vec4 worldPos = modelMatrix * vec4(position, 1.0);
     vWorldPos = worldPos.xyz;
     vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
     vNormal = normalize(normalMatrix * normal);
     vViewDir = normalize(-mvPos.xyz);
     gl_Position = projectionMatrix * mvPos;
   }`,
  /* fragment */
  `uniform vec3 uColor;
   uniform vec3 uColor2;
   uniform float uIntensity;
   uniform float uTime;
   uniform float uOpacity;
   uniform float uActive;
   varying vec3 vNormal;
   varying vec3 vViewDir;
   varying vec3 vWorldPos;
   varying vec2 vUv;

   void main() {
     float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.5);
     
     // Chromatic shift between two colors based on angle
     float blend = sin(vUv.y * 6.28 + uTime * 1.5) * 0.5 + 0.5;
     vec3 col = mix(uColor, uColor2, blend);
     
     // Energy pulse waves
     float wave1 = sin(vWorldPos.y * 8.0 - uTime * 3.0) * 0.5 + 0.5;
     float wave2 = sin(vWorldPos.x * 6.0 + uTime * 2.0) * 0.5 + 0.5;
     float energy = mix(0.6, 1.0, wave1 * wave2);
     
     // Active state adds extra pulse
     float activePulse = 1.0 + uActive * sin(uTime * 6.0) * 0.3;
     
     col *= fresnel * uIntensity * energy * activePulse;
     float alpha = fresnel * 0.8 * uOpacity * energy;
     
     gl_FragColor = vec4(col, alpha);
   }`
);

// Energy Shield — hexagonal pattern overlay
const EnergyShieldMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("#00FFFF"),
    uTime: 0,
    uOpacity: 0.15,
    uHit: 0.0,
  },
  /* vertex */
  `varying vec3 vNormal;
   varying vec3 vViewDir;
   varying vec3 vWorldPos;
   void main() {
     vec4 worldPos = modelMatrix * vec4(position, 1.0);
     vWorldPos = worldPos.xyz;
     vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
     vNormal = normalize(normalMatrix * normal);
     vViewDir = normalize(-mvPos.xyz);
     gl_Position = projectionMatrix * mvPos;
   }`,
  /* fragment */
  `uniform vec3 uColor;
   uniform float uTime;
   uniform float uOpacity;
   uniform float uHit;
   varying vec3 vNormal;
   varying vec3 vViewDir;
   varying vec3 vWorldPos;

   // Hex pattern
   float hexDist(vec2 p) {
     p = abs(p);
     return max(dot(p, normalize(vec2(1.0, 1.73))), p.x);
   }
   
   vec4 hexCoords(vec2 uv) {
     vec2 r = vec2(1.0, 1.73);
     vec2 h = r * 0.5;
     vec2 a = mod(uv, r) - h;
     vec2 b = mod(uv - h, r) - h;
     vec2 gv = dot(a, a) < dot(b, b) ? a : b;
     float x = atan(gv.x, gv.y);
     float y = 0.5 - hexDist(gv);
     return vec4(x, y, gv.x, gv.y);
   }

   void main() {
     float fresnel = pow(1.0 - dot(vNormal, vViewDir), 2.0);
     
     // Project world position to hex grid
     vec2 hexUv = vWorldPos.xy * 3.0 + vWorldPos.z * 1.5;
     vec4 hc = hexCoords(hexUv);
     float hexLine = smoothstep(0.0, 0.05, hc.y);
     float hexEdge = 1.0 - hexLine;
     
     // Scanning wave
     float scan = sin(vWorldPos.y * 4.0 - uTime * 2.0) * 0.5 + 0.5;
     scan = pow(scan, 4.0);
     
     vec3 col = uColor * (hexEdge * 0.6 + fresnel * 0.8 + scan * 0.4);
     float alpha = (hexEdge * 0.3 + fresnel * 0.5 + scan * 0.2) * uOpacity;
     alpha += uHit * 0.3;
     
     gl_FragColor = vec4(col, alpha);
   }`
);

extend({ VolumetricGlowMaterial, EnergyShieldMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    volumetricGlowMaterial: {
      ref?: React.Ref<THREE.ShaderMaterial & { uTime: number; uActive: number }>;
      uColor?: THREE.Color;
      uColor2?: THREE.Color;
      uIntensity?: number;
      uTime?: number;
      uOpacity?: number;
      uActive?: number;
      transparent?: boolean;
      side?: THREE.Side;
      depthWrite?: boolean;
    };
    energyShieldMaterial: {
      ref?: React.Ref<THREE.ShaderMaterial & { uTime: number; uHit: number }>;
      uColor?: THREE.Color;
      uTime?: number;
      uOpacity?: number;
      uHit?: number;
      transparent?: boolean;
      side?: THREE.Side;
      depthWrite?: boolean;
    };
  }
}

/* ═══════════════════════════════════════════════════════
   AGENT ORB — Premium multi-layer 3D entity
   ═══════════════════════════════════════════════════════ */
function AgentOrb({ agent }: { agent: GenmonAgent }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.ShaderMaterial & { uTime: number; uActive: number }>(null);
  const shieldRef = useRef<THREE.ShaderMaterial & { uTime: number; uHit: number }>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const helixRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.Points>(null);
  const time = useRef(Math.random() * 100);
  const [hovered, setHovered] = useState(false);
  const selected = useGenmonStore((s) => s.selectedAgent === agent.id);
  const selectAgent = useGenmonStore((s) => s.selectAgent);

  const color = useMemo(() => new THREE.Color(agent.color), [agent.color]);
  const color2 = useMemo(() => {
    const c = new THREE.Color(agent.color);
    c.offsetHSL(0.15, 0, 0.1);
    return c;
  }, [agent.color]);

  const baseSize = 0.22 + (agent.dna.riskTolerance / 100) * 0.18;
  const speed = 0.3 + (agent.dna.analyticalDepth / 100) * 0.5;
  const orbitRadius = 1.5 + (agent.dna.socialSavvy / 100) * 2;

  // DNA Helix points around the orb
  const helixData = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color(agent.color);
    const c2 = new THREE.Color(agent.color).offsetHSL(0.2, 0, 0);
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 4;
      const r = 1.2 + Math.sin(t * 0.5) * 0.15;
      const strand = i % 2 === 0 ? 1 : -1;
      pos[i * 3] = Math.cos(t) * r * 0.3 * strand;
      pos[i * 3 + 1] = (i / count - 0.5) * 2.5;
      pos[i * 3 + 2] = Math.sin(t) * r * 0.3 * strand;
      const mix = i / count;
      const cc = i % 2 === 0 ? c1 : c2;
      col[i * 3] = cc.r;
      col[i * 3 + 1] = cc.g;
      col[i * 3 + 2] = cc.b;
    }
    return { positions: pos, colors: col, count };
  }, [agent.color]);

  // Trail buffer
  const trailCount = 80;
  const trailPositions = useMemo(() => new Float32Array(trailCount * 3), []);
  const trailOpacities = useMemo(() => {
    const o = new Float32Array(trailCount);
    for (let i = 0; i < trailCount; i++) o[i] = 1 - i / trailCount;
    return o;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta * speed;
    const t = time.current;

    // Organic Lissajous movement
    const x = agent.position[0]
      + Math.sin(t * 0.7) * orbitRadius * 0.3
      + Math.sin(t * 1.1) * 0.15
      + Math.cos(t * 0.3) * 0.1;
    const y = agent.position[1]
      + Math.cos(t * 0.5) * orbitRadius * 0.2
      + Math.sin(t * 1.3) * 0.3;
    const z = agent.position[2]
      + Math.sin(t * 0.9) * orbitRadius * 0.3
      + Math.cos(t * 0.8) * 0.15;

    groupRef.current.position.set(x, y, z);

    // Scale with pulse
    const isActive = agent.status !== "idle";
    const pulse = isActive ? 1 + Math.sin(t * 5) * 0.12 : 1;
    const hoverScale = hovered ? 1.2 : 1;
    const selectedScale = selected ? 1.15 : 1;
    groupRef.current.scale.setScalar(baseSize * pulse * hoverScale * selectedScale);

    // Core rotation
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * (isActive ? 2.5 : 1.0);
      coreRef.current.rotation.x += delta * 0.4;
    }

    // Shader uniforms
    if (glowRef.current) {
      glowRef.current.uTime = t;
      glowRef.current.uActive = isActive ? 1.0 : 0.0;
    }
    if (shieldRef.current) {
      shieldRef.current.uTime = t;
      shieldRef.current.uHit = selected ? 0.5 : hovered ? 0.2 : 0.0;
    }

    // Ring rotations — 3 axes
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.6;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.4;
      ring2Ref.current.rotation.y = Math.cos(t * 0.4) * 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += delta * 0.3;
      ring3Ref.current.rotation.z = Math.sin(t * 0.2) * 0.3;
    }

    // DNA helix rotation
    if (helixRef.current) {
      helixRef.current.rotation.y += delta * 0.8;
    }

    // Trail
    if (trailRef.current) {
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3];
        positions[i + 1] = positions[i - 2];
        positions[i + 2] = positions[i - 1];
      }
      positions[0] = x;
      positions[1] = y;
      positions[2] = z;
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectAgent(agent.id);
  };

  const statusIcon = agent.status === "scouting" ? "🔍"
    : agent.status === "analyzing" ? "📊"
    : agent.status === "launching" ? "🚀"
    : agent.status === "breeding" ? "🧬" : "";

  const statusLabel = agent.status !== "idle" ? agent.status.toUpperCase() : "";

  return (
    <group>
      <group ref={groupRef}>
        {/* Layer 1: Inner crystalline core */}
        <mesh ref={coreRef} onClick={handleClick}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <icosahedronGeometry args={[0.6, 3]} />
          <meshPhysicalMaterial
            color={agent.color}
            emissive={agent.color}
            emissiveIntensity={selected ? 3.5 : hovered ? 2.5 : 1.5}
            roughness={0.05}
            metalness={0.9}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={agent.alive ? 1 : 0.25}
            envMapIntensity={2}
          />
        </mesh>

        {/* Layer 2: Volumetric glow shell */}
        <mesh>
          <sphereGeometry args={[1.0, 48, 48]} />
          <volumetricGlowMaterial
            ref={glowRef}
            uColor={color}
            uColor2={color2}
            uIntensity={selected ? 2.5 : hovered ? 1.8 : 1.0}
            uTime={0}
            uOpacity={agent.alive ? 1 : 0.2}
            uActive={0}
            transparent
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>

        {/* Layer 3: Energy shield with hex pattern */}
        <mesh>
          <sphereGeometry args={[1.15, 48, 48]} />
          <energyShieldMaterial
            ref={shieldRef}
            uColor={color}
            uTime={0}
            uOpacity={selected ? 0.25 : hovered ? 0.15 : 0.06}
            uHit={0}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Layer 4: Glass outer shell */}
        <mesh>
          <sphereGeometry args={[1.08, 32, 32]} />
          <meshPhysicalMaterial
            color={agent.color}
            transparent
            opacity={0.04}
            roughness={0}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0}
            transmission={0.95}
            thickness={0.5}
            ior={1.5}
          />
        </mesh>

        {/* Orbit rings — 3 axes for gyroscope effect */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.35, 0.012, 8, 100]} />
          <meshBasicMaterial color={agent.color} transparent opacity={selected ? 0.7 : hovered ? 0.4 : 0.15} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.01, 8, 100]} />
          <meshBasicMaterial color={agent.color} transparent opacity={selected ? 0.5 : hovered ? 0.3 : 0.1} />
        </mesh>
        <mesh ref={ring3Ref} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[1.65, 0.008, 8, 100]} />
          <meshBasicMaterial color={agent.color} transparent opacity={selected ? 0.35 : hovered ? 0.2 : 0.06} />
        </mesh>

        {/* DNA Helix particles */}
        <points ref={helixRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={helixData.count} array={helixData.positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={helixData.count} array={helixData.colors} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            size={0.04}
            transparent
            opacity={selected ? 0.8 : 0.3}
            vertexColors
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Agent point light */}
        <pointLight
          color={agent.color}
          intensity={selected ? 3 : hovered ? 1.5 : 0.5}
          distance={5}
          decay={2}
        />

        {/* Tooltip */}
        {(hovered || selected) && (
          <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
            <div className="bg-[#0a0a12]/95 border rounded-xl px-3 py-2.5 text-center whitespace-nowrap backdrop-blur-xl shadow-2xl shadow-black/60"
              style={{ borderColor: agent.color + "40" }}>
              <div className="flex items-center justify-center gap-1.5">
                {statusIcon && <span className="text-sm">{statusIcon}</span>}
                <span className="text-xs font-bold tracking-wide" style={{ color: agent.color }}>
                  {agent.name}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {agent.type} · Gen {agent.generation}
                {statusLabel && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[8px] font-medium"
                    style={{ background: agent.color + "20", color: agent.color }}>
                    {statusLabel}
                  </span>
                )}
              </div>
              <div className="flex gap-3 justify-center mt-1.5 text-[9px] text-gray-500">
                <span>⚡ Risk {agent.dna.riskTolerance}</span>
                <span>🎨 Create {agent.dna.creativity}</span>
                <span>📡 Social {agent.dna.socialSavvy}</span>
              </div>
              <div className="flex gap-2 justify-center mt-1 text-[9px]">
                <span className="text-green-400">✓ {agent.successCount}</span>
                <span className="text-red-400">✗ {agent.failCount}</span>
              </div>
              {agent.thoughts.length > 0 && (
                <div className="text-[10px] text-gray-500 max-w-[240px] truncate mt-1.5 border-t pt-1.5"
                  style={{ borderColor: agent.color + "15" }}>
                  💭 {agent.thoughts[agent.thoughts.length - 1]}
                </div>
              )}
            </div>
          </Html>
        )}
      </group>

      {/* Energy trail */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={trailCount} array={trailPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color={agent.color}
          size={0.035}
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   CONNECTION BEAMS — Animated energy lines between agents
   ═══════════════════════════════════════════════════════ */
function ConnectionBeams() {
  const messages = useGenmonStore((s) => s.swarmMessages);
  const agents = useGenmonStore((s) => s.agents);
  const lineRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const recentMessages = messages.filter((m) => Date.now() - m.timestamp < 4000);

  const { linePositions, particlePositions } = useMemo(() => {
    const lPos: number[] = [];
    const pPos: number[] = [];
    recentMessages.forEach((msg) => {
      const from = agents.find((a) => a.id === msg.from);
      const to = agents.find((a) => a.id === msg.to);
      if (from && to) {
        lPos.push(...from.position, ...to.position);
        // Midpoint particles
        for (let i = 0; i < 5; i++) {
          const t = (i + 1) / 6;
          pPos.push(
            from.position[0] + (to.position[0] - from.position[0]) * t + (Math.random() - 0.5) * 0.2,
            from.position[1] + (to.position[1] - from.position[1]) * t + (Math.random() - 0.5) * 0.2,
            from.position[2] + (to.position[2] - from.position[2]) * t + (Math.random() - 0.5) * 0.2,
          );
        }
      }
    });
    return {
      linePositions: new Float32Array(lPos),
      particlePositions: new Float32Array(pPos),
    };
  }, [recentMessages, agents]);

  useFrame(() => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.25 + Math.sin(Date.now() * 0.004) * 0.1;
    }
  });

  if (linePositions.length === 0) return null;

  return (
    <group>
      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={linePositions.length / 3} array={linePositions} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#00FFFF" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {particlePositions.length > 0 && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={particlePositions.length / 3} array={particlePositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            color="#00FFFF"
            size={0.06}
            transparent
            opacity={0.7}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   DEEP SPACE NEBULA — Multi-layer particle background
   ═══════════════════════════════════════════════════════ */
function DeepSpaceNebula() {
  const layer1Ref = useRef<THREE.Points>(null);
  const layer2Ref = useRef<THREE.Points>(null);
  const layer3Ref = useRef<THREE.Points>(null);

  const layer1 = useMemo(() => createStarLayer(600, 8, 18, ["#00FFFF", "#0088AA", "#004466"]), []);
  const layer2 = useMemo(() => createStarLayer(400, 12, 25, ["#BF00FF", "#6600AA", "#330066"]), []);
  const layer3 = useMemo(() => createStarLayer(200, 5, 10, ["#FF00AA", "#FF66CC", "#ffffff"]), []);

  useFrame((_, delta) => {
    if (layer1Ref.current) { layer1Ref.current.rotation.y += delta * 0.006; layer1Ref.current.rotation.x += delta * 0.002; }
    if (layer2Ref.current) { layer2Ref.current.rotation.y -= delta * 0.004; layer2Ref.current.rotation.z += delta * 0.001; }
    if (layer3Ref.current) { layer3Ref.current.rotation.y += delta * 0.01; }
  });

  return (
    <group>
      <points ref={layer1Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={600} array={layer1.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={600} array={layer1.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.035} transparent opacity={0.6} vertexColors sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <points ref={layer2Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={400} array={layer2.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={400} array={layer2.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.025} transparent opacity={0.4} vertexColors sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <points ref={layer3Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={200} array={layer3.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={200} array={layer3.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.05} transparent opacity={0.8} vertexColors sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

function createStarLayer(count: number, minR: number, maxR: number, palette: string[]) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cols = palette.map((c) => new THREE.Color(c));
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = minR + Math.random() * (maxR - minR);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = cols[Math.floor(Math.random() * cols.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  return { positions, colors };
}

/* ═══════════════════════════════════════════════════════
   HOLOGRAPHIC GRID FLOOR
   ═══════════════════════════════════════════════════════ */
function HoloGrid() {
  const ref = useRef<THREE.GridHelper>(null);
  useFrame(() => {
    if (ref.current) {
      (ref.current.material as THREE.Material).opacity = 0.04 + Math.sin(Date.now() * 0.0008) * 0.015;
    }
  });
  return (
    <gridHelper
      ref={ref}
      args={[40, 60, "#00FFFF", "#BF00FF"]}
      position={[0, -3.5, 0]}
      material-transparent
      material-opacity={0.04}
      material-blending={THREE.AdditiveBlending}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   SWARM NEXUS — Central holographic core
   ═══════════════════════════════════════════════════════ */
function SwarmNexus() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const agents = useGenmonStore((s) => s.agents);
  const aliveCount = agents.filter((a) => a.alive).length;

  useFrame((_, delta) => {
    if (!outerRef.current) return;
    const t = Date.now() * 0.001;
    outerRef.current.rotation.y += delta * 0.2;
    outerRef.current.rotation.x += delta * 0.08;
    const s = 0.12 + aliveCount * 0.025 + Math.sin(t) * 0.02;
    outerRef.current.scale.setScalar(s);

    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.5;
      innerRef.current.rotation.z += delta * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
  });

  if (aliveCount === 0) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Outer wireframe */}
      <mesh ref={outerRef}>
        <octahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" emissive="#BF00FF" emissiveIntensity={0.6} wireframe transparent opacity={0.25} />
      </mesh>
      {/* Inner solid */}
      <mesh ref={innerRef} scale={0.06 + aliveCount * 0.012}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#BF00FF" emissive="#FF00AA" emissiveIntensity={2} transparent opacity={0.6} />
      </mesh>
      {/* Horizontal ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} scale={0.15 + aliveCount * 0.03}>
        <torusGeometry args={[1.5, 0.02, 8, 80]} />
        <meshBasicMaterial color="#BF00FF" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Nexus light */}
      <pointLight color="#BF00FF" intensity={0.5 + aliveCount * 0.1} distance={6} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   AMBIENT FLOATING PARTICLES — Dust motes in the scene
   ═══════════════════════════════════════════════════════ */
function AmbientDust() {
  const ref = useRef<THREE.Points>(null);
  const count = 150;
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = Math.random() * 0.003 + 0.001;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return { pos, vel };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3] += data.vel[i * 3];
      positions[i * 3 + 1] += data.vel[i * 3 + 1];
      positions[i * 3 + 2] += data.vel[i * 3 + 2];
      // Reset if too far
      if (Math.abs(positions[i * 3 + 1]) > 5) {
        positions[i * 3 + 1] = -4;
        positions[i * 3] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={data.pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.015}
        transparent
        opacity={0.25}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════════════════ */
export default function SwarmVisualization() {
  const agents = useGenmonStore((s) => s.agents);
  const selectAgent = useGenmonStore((s) => s.selectAgent);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 2.5, 9], fov: 50 }}
        onPointerMissed={() => selectAgent(null)}
        style={{ cursor: "grab" }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
      >
        {/* Cinematic lighting */}
        <ambientLight intensity={0.08} />
        <directionalLight position={[5, 8, 5]} intensity={0.3} color="#E0F0FF" />
        <pointLight position={[10, 6, 8]} intensity={0.4} color="#00FFFF" decay={2} distance={30} />
        <pointLight position={[-10, -3, -8]} intensity={0.3} color="#BF00FF" decay={2} distance={30} />
        <pointLight position={[0, 8, 0]} intensity={0.15} color="#FF00AA" decay={2} distance={20} />
        <pointLight position={[0, -8, 0]} intensity={0.08} color="#00FFFF" decay={2} distance={20} />

        {/* Depth fog */}
        <fog attach="fog" args={["#050510", 10, 30]} />

        {/* Environment layers */}
        <DeepSpaceNebula />
        <HoloGrid />
        <AmbientDust />
        <SwarmNexus />

        {/* Agent connections */}
        <ConnectionBeams />

        {/* Agent orbs */}
        {agents.map((agent) => (
          <AgentOrb key={agent.id} agent={agent} />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.04}
          maxDistance={20}
          minDistance={2}
          enablePan
          autoRotate={agents.length === 0}
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
