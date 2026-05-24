import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { triggerSpray } from '../lib/spray.js';

/**
 * Full-screen intro overlay. Shows a real, procedurally-built glass
 * perfume bottle (no labels) using three.js / R3F. The bottle's pump
 * is automatically pressed, firing a screen-filling spray burst through
 * the SprayCanvas. After ~3.6s the overlay fades out and never comes
 * back during the session (sessionStorage-gated by App.jsx).
 *
 * Glass material uses MeshPhysicalMaterial with transmission for real
 * refraction. An HDR environment from drei provides reflections.
 */

const TOTAL_DURATION = 3600;

export function IntroSpray({ onFinish }) {
  const [phase, setPhase] = useState('in');     // 'in' | 'fading' | 'done'
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), TOTAL_DURATION - 600);
    const t2 = setTimeout(() => {
      setPhase('done');
      onFinish?.();
    }, TOTAL_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  function skip() {
    if (skipping) return;
    setSkipping(true);
    setPhase('fading');
    setTimeout(() => { setPhase('done'); onFinish?.(); }, 320);
  }

  if (phase === 'done') return null;

  return (
    <div
      className={`intro-spray ${phase === 'fading' ? 'fading' : ''}`}
      role="dialog"
      aria-label="Intro animation"
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      >
        <color attach="background" args={['#0d0907']} />
        <fog attach="fog" args={['#0d0907', 6, 14]} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff4dc" />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#b88a4a" />
        <pointLight position={[0, -2, 3]} intensity={0.4} color="#f5d29a" />

        <Suspense fallback={null}>
          <Environment preset="studio" />
        </Suspense>

        <BottleRig onSpray={triggerScreenSpray} />

        <ContactShadows
          position={[0, -1.18, 0]}
          opacity={0.55}
          scale={4}
          blur={2.4}
          far={2}
          color="#000"
        />
      </Canvas>

      <button type="button" className="intro-spray-skip" onClick={skip}>Skip</button>
      <div className="intro-spray-vignette" aria-hidden="true" />
    </div>
  );
}

/**
 * Fire a screen-filling spray. Origin is the screen center because the
 * bottle is centered. Uses the existing global event so SprayCanvas
 * handles the actual particle rendering.
 */
function triggerScreenSpray() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  triggerSpray({ x, y, direction: 'burst' });
}

/**
 * The bottle + the timed animation that drives it. The cap rises,
 * then the atomizer button presses, then we fire the spray. Subtle
 * tilt + idle float for life.
 */
function BottleRig({ onSpray }) {
  const groupRef = useRef(null);
  const capRef = useRef(null);
  const buttonRef = useRef(null);
  const t0Ref = useRef(performance.now());
  const sprayedRef = useRef(false);

  useFrame(() => {
    const elapsed = performance.now() - t0Ref.current;
    const group = groupRef.current;
    const cap = capRef.current;
    const button = buttonRef.current;
    if (!group || !cap || !button) return;

    // Entry: 0,700ms, bottle fades / scales in
    const entryT = clamp(elapsed / 700, 0, 1);
    const eased = easeOutCubic(entryT);
    group.scale.setScalar(0.85 + eased * 0.15);
    group.position.y = -0.35 + eased * 0.35;

    // Idle float after entry (sin)
    if (elapsed > 700) {
      const idleT = (elapsed - 700) / 1000;
      group.position.y = 0 + Math.sin(idleT * 1.6) * 0.04;
      group.rotation.y = Math.sin(idleT * 0.9) * 0.18;
    }

    // Cap rise: 1000ms → 1700ms
    const capT = clamp((elapsed - 1000) / 700, 0, 1);
    const capEase = easeOutBack(capT);
    cap.position.y = capEase * 0.55;
    cap.rotation.z = capEase * 0.18;
    cap.position.x = capEase * 0.06;

    // Button press: 1700ms → 1900ms then release
    const pressT = clamp((elapsed - 1700) / 200, 0, 1);
    const releaseT = clamp((elapsed - 1900) / 200, 0, 1);
    const press = pressT - releaseT * pressT;
    button.position.y = 0.97 - press * 0.05;

    // Fire spray once, when the button is fully depressed
    if (!sprayedRef.current && elapsed >= 1850) {
      sprayedRef.current = true;
      onSpray?.();
    }
  });

  return (
    <group ref={groupRef}>
      <BottleBody />
      <BottleCollar />
      <group ref={capRef} position={[0, 0, 0]}>
        <BottleCap />
        <group ref={buttonRef} position={[0, 0.97, 0]}>
          <PumpButton />
          <PumpNozzle />
        </group>
      </group>
    </group>
  );
}

/**
 * Bottle body, clear glass with subtle amber-tinted liquid inside.
 * Built with LatheGeometry for the curved shoulder profile.
 */
function BottleBody() {
  const profile = useMemo(() => {
    // Half-silhouette of the bottle, top → bottom. x = radius, y = height.
    // 0 is the bottle's vertical center.
    const pts = [];
    pts.push(new THREE.Vector2(0.0, 0.60));   // top of neck
    pts.push(new THREE.Vector2(0.16, 0.60));
    pts.push(new THREE.Vector2(0.16, 0.50));  // neck base
    pts.push(new THREE.Vector2(0.30, 0.42));  // shoulder curve
    pts.push(new THREE.Vector2(0.42, 0.32));
    pts.push(new THREE.Vector2(0.50, 0.18));
    pts.push(new THREE.Vector2(0.52, 0.05));
    pts.push(new THREE.Vector2(0.52, -0.60)); // straight body
    pts.push(new THREE.Vector2(0.50, -0.72)); // base bevel
    pts.push(new THREE.Vector2(0.42, -0.78));
    pts.push(new THREE.Vector2(0.00, -0.78)); // closed bottom
    return pts;
  }, []);

  return (
    <group>
      {/* Outer glass */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[profile, 96]} />
        <meshPhysicalMaterial
          color={'#ffffff'}
          transmission={1}
          thickness={1.2}
          roughness={0.04}
          ior={1.48}
          attenuationColor={'#e8c98a'}
          attenuationDistance={1.6}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.2}
          metalness={0}
        />
      </mesh>

      {/* Amber liquid, slightly inset, fills ~75% */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.85, 64]} />
        <meshPhysicalMaterial
          color={'#b88040'}
          transmission={0.55}
          thickness={2.5}
          roughness={0.15}
          ior={1.36}
          attenuationColor={'#7a4a18'}
          attenuationDistance={0.6}
          envMapIntensity={0.8}
          metalness={0}
        />
      </mesh>

      {/* Liquid surface, slightly brighter so the meniscus reads */}
      <mesh position={[0, 0.245, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.005, 64]} />
        <meshPhysicalMaterial
          color={'#d8a866'}
          roughness={0.2}
          transmission={0.6}
          thickness={0.1}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
}

/** Metal collar between the bottle neck and the cap. */
function BottleCollar() {
  return (
    <mesh position={[0, 0.66, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.10, 48]} />
      <meshStandardMaterial
        color={'#d4af72'}
        roughness={0.28}
        metalness={1}
        envMapIntensity={1.4}
      />
    </mesh>
  );
}

/** Cap, slightly conical, polished gold. */
function BottleCap() {
  return (
    <mesh position={[0, 0.88, 0]} castShadow>
      <cylinderGeometry args={[0.21, 0.23, 0.32, 48]} />
      <meshStandardMaterial
        color={'#e8c989'}
        roughness={0.18}
        metalness={1}
        envMapIntensity={1.6}
      />
    </mesh>
  );
}

/** Atomizer button on top of the cap. */
function PumpButton() {
  return (
    <mesh castShadow>
      <cylinderGeometry args={[0.14, 0.15, 0.07, 40]} />
      <meshStandardMaterial
        color={'#f0d9a3'}
        roughness={0.22}
        metalness={1}
        envMapIntensity={1.6}
      />
    </mesh>
  );
}

/** Tiny nozzle on the button, the visual origin of the spray. */
function PumpNozzle() {
  return (
    <mesh position={[0, 0.045, 0]}>
      <cylinderGeometry args={[0.018, 0.018, 0.03, 16]} />
      <meshStandardMaterial color={'#0e0805'} roughness={0.4} metalness={0.7} />
    </mesh>
  );
}

// ── easing helpers ─────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
