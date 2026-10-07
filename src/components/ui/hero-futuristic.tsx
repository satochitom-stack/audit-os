"use client";

import React, { useRef, useState, useEffect, Component } from "react";
import * as THREE from "three";


const heroFuturisticStyles = `
.hero-futuristic {
  position: relative;
  overflow: hidden;
  background: #000;
  font-family: inherit;
  width: 100%;
  height: 100vh;
}
.hero-futuristic .fade-in {
  opacity: 0;
  will-change: transform, opacity, filter, text-shadow;
  animation: 0.85s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards fadeInUpBounce,
    1.2s linear 0.7s glitch;
  transform: translateY(60px) scale(0.85) rotate(-8deg);
}
.hero-futuristic .fade-in-subtitle {
  opacity: 0;
  will-change: transform, opacity, filter, text-shadow;
  animation: 1.1s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards fadeInUpBounce,
    1.3s linear 1s glitch;
  transform: translateY(40px) scale(0.92);
}
@keyframes fadeInUpBounce {
  0% { opacity: 0; transform: translateY(60px) scale(0.85) rotate(-8deg); }
  40% { opacity: 0.7; transform: translateY(-10px) scale(1.05) rotate(2deg); }
  70% { opacity: 1; transform: translateY(4px) scale(0.98) rotate(-1deg); }
  to { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
}
@keyframes glitch {
  0% { text-shadow: 2px 0 #ff00c8, -2px 0 #00fff9; filter: blur(0.5px); transform: translate(0); }
  10% { text-shadow: -2px 0 #ff00c8, 2px 0 #00fff9; filter: blur(1px); transform: translate(-2px); }
  20% { text-shadow: 2px 2px #ff00c8, -2px -2px #00fff9; filter: blur(0.5px); transform: translate(2px); }
  30% { text-shadow: -1px 1px #ff00c8, 1px -1px #00fff9; filter: blur(1px); transform: translate(-1px); }
  40% { text-shadow: 1px -1px #ff00c8, -1px 1px #00fff9; filter: blur(0.5px); transform: translate(1px); }
  50% { text-shadow: 0 0 #ff00c8, 0 0 #00fff9; filter: blur(0); transform: translate(0); }
  to { text-shadow: none; filter: none; transform: none; }
}
.hero-futuristic .explore-btn {
  z-index: 100;
  color: #fff;
  letter-spacing: 0.05em;
  cursor: pointer;
  pointer-events: auto;
  opacity: 0;
  background: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(6, 182, 212, 0.4);
  border-radius: 9999px;
  outline: none;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  transition: all 0.25s ease;
  animation: 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) 2.2s forwards fadeInBtn;
  display: inline-flex;
  position: absolute;
  bottom: 35px;
  left: 50%;
  transform: translate(-50%);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.2);
}
.hero-futuristic .explore-btn:hover {
  background: #06b6d4;
  color: #020617;
  border-color: #06b6d4;
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
}
@keyframes fadeInBtn {
  0% { opacity: 0; transform: translate(-50%) translateY(30px) scale(0.98); }
  60% { opacity: 0.7; transform: translate(-50%) translateY(-6px) scale(1.03); }
  to { opacity: 1; transform: translate(-50%) translateY(0) scale(1); }
}
.hero-futuristic .explore-arrow {
  align-items: center;
  display: flex;
}
.hero-futuristic .arrow-svg {
  animation: 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite alternate arrowBounce;
  display: block;
}
@keyframes arrowBounce {
  0% { transform: translateY(0); }
  to { transform: translateY(6px); }
}
`;

class HeroErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn("Hero canvas caught by safety boundary:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
          <div className="w-80 h-80 rounded-full bg-red-600/20 blur-3xl animate-pulse" />
        </div>
      );
    }
    return this.props.children;
  }
}

// 3D Scene: Exact 21st.dev Futuristic Liquid Sculpture with Depth Parallax & Red Laser Scanner
const ThreeCanvasScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animId: number;
    let isDisposed = false;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.z = 2.4;

      // 21st.dev Vertex Shader: 2D Plane with Parallax UVs
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      // 21st.dev Fragment Shader: Depth Displacement + Topographic Laser Slice + Dot Matrix + Screen Blend
      const fragmentShader = `
        uniform sampler2D u_texture;
        uniform sampler2D u_depth;
        uniform vec2 u_pointer;
        uniform float u_time;
        uniform float u_progress;
        uniform float u_opacity;

        varying vec2 vUv;

        // 21st.dev mx_cell_noise hash helper for dot matrix variation
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          vec4 depthColor = texture2D(u_depth, vUv);
          float depth = depthColor.r;

          // Parallax displacement based on depth map and cursor pointer
          float strength = 0.022;
          vec2 displacedUv = clamp(vUv + depth * u_pointer * strength, 0.0, 1.0);
          vec4 color = texture2D(u_texture, displacedUv);

          // 21st.dev exact dot matrix formula (tiling = 120.0)
          vec2 tiling = vec2(120.0);
          vec2 tiledUv = mod(vUv * tiling, 2.0) - 1.0;
          float dist = length(tiledUv);
          float dotMask = smoothstep(0.5, 0.48, dist);
          float brightness = hash(floor(vUv * 60.0));
          float dot = dotMask * brightness;

          // Topographical contour laser flow slice wave
          float sliceDist = abs(depth - u_progress);
          float flow = 1.0 - smoothstep(0.0, 0.025, sliceDist);

          // Red laser contour mask (exact 21st.dev formula)
          vec3 redMask = dot * flow * vec3(10.0, 0.1, 0.2);

          // Horizontal laser scan line overlay (21st.dev PostProcessing effect)
          float scanWidth = 0.045;
          float scanDist = abs(vUv.y - u_progress);
          float scanLine = smoothstep(0.0, scanWidth, scanDist);
          vec3 redOverlay = vec3(1.0, 0.0, 0.1) * (1.0 - scanLine) * 0.45;

          // Screen blend: 1.0 - (1.0 - base) * (1.0 - blend)
          vec3 blended = 1.0 - (1.0 - color.rgb) * (1.0 - redMask);
          vec3 finalColor = blended + redOverlay;

          // Final alpha with smooth entrance fade
          float alpha = color.a * u_opacity;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `;

      // Blank 1x1 initial textures
      const makeBlankTexture = () => {
        const data = new Uint8Array(4);
        data[0] = 0;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
        tex.needsUpdate = true;
        return tex;
      };

      const uniforms = {
        u_texture: { value: makeBlankTexture() },
        u_depth: { value: makeBlankTexture() },
        u_pointer: { value: new THREE.Vector2(0, 0) },
        u_time: { value: 0 },
        u_progress: { value: 0 },
        u_opacity: { value: 0.0 },
      };

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
      });

      const geometry = new THREE.PlaneGeometry(1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Sizing helper: keeps the 3D element in perfect proportion across screen sizes
      const updateSize = () => {
        if (!container || !renderer || isDisposed) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);

        const vFov = (camera.fov * Math.PI) / 180;
        const visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
        const visibleWidth = visibleHeight * camera.aspect;

        // Perfectly proportioned behind hero typography without overflowing
        const size = Math.min(visibleHeight * 0.70, visibleWidth * 0.88);
        mesh.scale.set(size, size, 1);
      };
      updateSize();

      // Texture loader with crossOrigin and automatic CDN fallback
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");

      let texReady = false;
      let depthReady = false;
      let targetOpacity = 0.0;
      let currentOpacity = 0.0;

      const checkReady = () => {
        if (texReady && depthReady && !isDisposed) {
          targetOpacity = 1.0;
        }
      };

      // Load main color/sculpture texture
      loader.load(
        "./assets/hero-texture.png",
        (tex) => {
          if (isDisposed) return;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          uniforms.u_texture.value = tex;
          texReady = true;
          checkReady();
        },
        undefined,
        () => {
          loader.load(
            "https://cdn.21st.dev/assets/mirror/f5/f58ba468bf6d3a2c9627178a1837f0f899b37b5dd5e34a00a3e11671cc7a59dc.png",
            (t) => {
              if (isDisposed) return;
              t.minFilter = THREE.LinearFilter;
              uniforms.u_texture.value = t;
              texReady = true;
              checkReady();
            }
          );
        }
      );

      // Load depth displacement texture
      loader.load(
        "./assets/hero-depth.webp",
        (tex) => {
          if (isDisposed) return;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          uniforms.u_depth.value = tex;
          depthReady = true;
          checkReady();
        },
        undefined,
        () => {
          loader.load(
            "https://cdn.21st.dev/assets/mirror/4d/4dc433ce306f213c0db63b6ead769e11eb0646612d488ed799053c63904b942d.webp",
            (t) => {
              if (isDisposed) return;
              t.minFilter = THREE.LinearFilter;
              uniforms.u_depth.value = t;
              depthReady = true;
              checkReady();
            }
          );
        }
      );

      // Subtle ambient data dust particles (for spatial depth)
      const particleCount = 50;
      const particleGeom = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 3.5;
        particlePositions[i + 1] = (Math.random() - 0.5) * 2.5;
        particlePositions[i + 2] = (Math.random() - 0.5) * 1.5 - 0.3;
      }
      particleGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(particlePositions, 3)
      );
      const particleMat = new THREE.PointsMaterial({
        color: 0x67e8f9,
        size: 0.016,
        transparent: true,
        opacity: 0.35,
      });
      const particles = new THREE.Points(particleGeom, particleMat);
      scene.add(particles);

      // Mouse Parallax Pointer Tracking
      const targetPointer = new THREE.Vector2(0, 0);
      const handlePointerMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        targetPointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        targetPointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("resize", updateSize);

      const clock = new THREE.Clock();

      const animate = () => {
        if (isDisposed || !renderer) return;
        animId = requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        uniforms.u_time.value = elapsedTime;
        // 21st.dev exact laser scan frequency
        uniforms.u_progress.value = Math.sin(elapsedTime * 0.5) * 0.5 + 0.5;

        // Smooth cursor lerp
        uniforms.u_pointer.value.lerp(targetPointer, 0.07);

        // Smooth opacity fade-in once textures arrive
        currentOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.05);
        uniforms.u_opacity.value = currentOpacity;

        // Subtle 3D perspective tilt
        mesh.rotation.y = uniforms.u_pointer.value.x * 0.14;
        mesh.rotation.x = -uniforms.u_pointer.value.y * 0.14;

        // Subtle camera breathing
        camera.position.x = uniforms.u_pointer.value.x * 0.04;
        camera.position.y = uniforms.u_pointer.value.y * 0.04;
        camera.lookAt(0, 0, 0);

        // Slow ambient particle drift
        particles.rotation.y = elapsedTime * 0.02;

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("resize", updateSize);
        geometry.dispose();
        particleGeom.dispose();
        material.dispose();
        particleMat.dispose();
        renderer?.dispose();
      };
    } catch (e) {
      console.warn("WebGL initialization failed, using safe fallback", e);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export interface HeroFuturisticProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  subtext?: string;
  buttonText?: string;
  buttonSubtext?: string;
  onExplore?: () => void;
}

export const Html = ({
  badge = "INTERNAL AUDIT OPERATING SYSTEM • อบต.ฝางคำ",
  title = "IA-OS FANG KHAM",
  subtitle = "ระบบปฏิบัติการตรวจสอบภายในยุคดิจิทัล องค์การบริหารส่วนตำบลฝางคำ",
  subtext = "วิเคราะห์ความเสี่ยง SOFCK • แผนตรวจสอบ ว 614 • การควบคุมภายใน ปอ.1-ปค.5",
  buttonText = "สำรวจระบบงาน",
  buttonSubtext = "SCROLL TO EXPLORE",
  onExplore,
}: HeroFuturisticProps) => {
  const titleWords = title.split(" ");
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const [subtitleDelay, setSubtitleDelay] = useState(0);

  useEffect(() => {
    setDelays(titleWords.map(() => Math.random() * 0.07));
    setSubtitleDelay(Math.random() * 0.1);
  }, [titleWords.length]);

  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 500);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setSubtitleVisible(true), 600);
      return () => clearTimeout(timeout);
    }
  }, [visibleWords, titleWords.length]);

  return (
    <HeroErrorBoundary>
      <style>{heroFuturisticStyles}</style>
      <div className="hero-futuristic h-svh relative select-none w-full bg-black">
        {/* Exact 3D Canvas Scene */}
        <ThreeCanvasScene />

        {/* Subtle background red glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Typography Overlay */}
        <div className="h-svh items-center w-full absolute z-40 pointer-events-none px-4 sm:px-6 md:px-10 flex justify-center flex-col text-center">
          {/* Futuristic Kicker Badge */}
          {badge && (
            <div
              className={`mb-3 sm:mb-4 inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-mono tracking-widest uppercase border border-cyan-500/30 bg-slate-950/80 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md transition-all duration-700 ${
                subtitleVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <span>{badge}</span>
            </div>
          )}

          {/* Glitch Animated Main Title */}
          <div className="text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight uppercase">
            <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-4 overflow-hidden text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
              {titleWords.map((word, index) => (
                <div
                  key={index}
                  className={index < visibleWords ? "fade-in" : ""}
                  style={{
                    animationDelay: `${index * 0.13 + (delays[index] || 0)}s`,
                    opacity: index < visibleWords ? undefined : 0,
                  }}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle with glow */}
          {subtitle && (
            <div className="text-sm sm:text-lg md:text-xl xl:text-2xl mt-3 sm:mt-4 text-cyan-100 font-bold tracking-wide drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)] max-w-3xl px-2">
              <div
                className={subtitleVisible ? "fade-in-subtitle" : ""}
                style={{
                  animationDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`,
                  opacity: subtitleVisible ? undefined : 0,
                }}
              >
                {subtitle}
              </div>
            </div>
          )}

          {/* Subtext description */}
          {subtext && (
            <div className="text-xs sm:text-sm md:text-base mt-2 text-slate-300 font-normal tracking-normal max-w-2xl px-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              <div
                className={subtitleVisible ? "fade-in-subtitle" : ""}
                style={{
                  animationDelay: `${titleWords.length * 0.13 + 0.35 + subtitleDelay}s`,
                  opacity: subtitleVisible ? undefined : 0,
                }}
              >
                {subtext}
              </div>
            </div>
          )}
        </div>

        {/* Explore Pill Button */}
        <button
          type="button"
          onClick={onExplore}
          className="explore-btn hover:bg-cyan-400 hover:text-slate-950 hover:border-cyan-400 transition-all cursor-pointer group"
          style={{ animationDelay: "2.2s" }}
        >
          <div className="flex flex-col leading-tight items-center text-xs sm:text-sm">
            <span>{buttonText}</span>
            <span className="text-[9px] sm:text-[10px] opacity-75 font-mono tracking-wider group-hover:text-slate-900">
              {buttonSubtext}
            </span>
          </div>
          <span className="explore-arrow">
            <svg
              width="20"
              height="20"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="arrow-svg"
            >
              <path
                d="M11 5V17"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M6 12L11 17L16 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </HeroErrorBoundary>
  );
};

export default Html;
