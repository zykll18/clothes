"use client";

import * as THREE from "three";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Preload,
  Text,
  useFBO,
  useGLTF,
} from "@react-three/drei";
import { easing } from "maath";
import { memo, useEffect, useMemo, useRef, useState } from "react";

type LensGlb = {
  nodes: {
    Cylinder?: {
      geometry: THREE.BufferGeometry;
    };
  };
};

type Size = {
  width: number;
  height: number;
};

type VideoHlsInstance = {
  loadSource: (src: string) => void;
  attachMedia: (media: HTMLVideoElement) => void;
  destroy: () => void;
};

type FlowerVideoState = {
  texture: THREE.VideoTexture | null;
  aspect: number | null;
  ready: boolean;
};

const MIN_CANVAS_WIDTH = 390;
const MIN_CANVAS_HEIGHT = 640;
const FLOWER_VIDEO_SRC =
  "https://stream.mux.com/ajgB02kpdVJOjKWIC6hWuanvwH00wkj2LmeMkgYm00BA28.m3u8";
const HLS_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";

const useViewportSize = () => {
  const [size, setSize] = useState<Size>({
    width: MIN_CANVAS_WIDTH,
    height: MIN_CANVAS_HEIGHT,
  });

  useEffect(() => {
    const update = () => {
      setSize({
        width: Math.max(window.innerWidth, MIN_CANVAS_WIDTH),
        height: Math.max(window.innerHeight, MIN_CANVAS_HEIGHT),
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
};

const useScrollProgress = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollRange = Math.max(section.offsetHeight - window.innerHeight, 1);
      setProgress(Math.min(1, Math.max(0, -rect.top / scrollRange)));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return { sectionRef, progress };
};

const makeRoundedRectShape = (width: number, height: number, radius: number) => {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
};

const loadHlsConstructor = async () => {
  if (window.Hls) return window.Hls;

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${HLS_SCRIPT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      setTimeout(resolve, 1200);
      return;
    }

    const script = document.createElement("script");
    script.src = HLS_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(), { once: true });
    document.head.appendChild(script);
  });

  return window.Hls ?? null;
};

const useFlowerVideoTexture = (): FlowerVideoState => {
  const [state, setState] = useState<FlowerVideoState>({
    texture: null,
    aspect: null,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    let hls: VideoHlsInstance | null = null;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Muted autoplay can still be blocked in edge cases; fallback motif stays visible.
      }
    };

    const updateAspect = () => {
      if (!video.videoWidth || !video.videoHeight) return;

      setState({
        texture,
        aspect: video.videoWidth / video.videoHeight,
        ready: video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
      });
    };

    const markReady = () => {
      setState((current) => ({
        texture,
        aspect: current.aspect ?? video.videoWidth / Math.max(video.videoHeight, 1),
        ready: true,
      }));
    };

    video.addEventListener("loadedmetadata", updateAspect);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);

    const setup = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = FLOWER_VIDEO_SRC;
        video.load();
        await tryPlay();
        return;
      }

      try {
        const Hls = await loadHlsConstructor();
        if (cancelled || !Hls?.isSupported()) return;

        hls = new Hls();
        hls.loadSource(FLOWER_VIDEO_SRC);
        hls.attachMedia(video);
        await tryPlay();
      } catch {
        // Keep the procedural fallback if the external player cannot load.
      }
    };

    void setup();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", updateAspect);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
    };
  }, []);

  return state;
};

function RoundedPanel({
  position,
  width,
  height,
  radius,
  opacity = 0.08,
  strokeOpacity = 0.26,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  radius: number;
  opacity?: number;
  strokeOpacity?: number;
}) {
  const shape = useMemo(
    () => makeRoundedRectShape(width, height, radius),
    [height, radius, width],
  );

  return (
    <group position={position}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      <lineSegments position={[0, 0, 0.01]}>
        <edgesGeometry args={[new THREE.ShapeGeometry(shape)]} />
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={strokeOpacity}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

function LabelText({
  children,
  position,
  fontSize,
  opacity = 1,
  maxWidth,
  anchorX = "left",
}: {
  children: string;
  position: [number, number, number];
  fontSize: number;
  opacity?: number;
  maxWidth?: number;
  anchorX?: "left" | "center" | "right";
}) {
  return (
    <Text
      position={position}
      fontSize={fontSize}
      color="white"
      anchorX={anchorX}
      anchorY="top"
      maxWidth={maxWidth}
      lineHeight={1.08}
      fillOpacity={opacity}
      outlineWidth={0}
    >
      {children}
    </Text>
  );
}

function FlowerMotif({
  centerX,
  centerY,
  scale,
}: {
  centerX: number;
  centerY: number;
  scale: number;
}) {
  const petals = [
    [-0.02, 0.62, 0.64, 1.85, 0.72, 0.2],
    [0.5, 0.44, 0.48, 1.48, 1.36, 0.16],
    [-0.5, 0.18, 0.46, 1.34, -0.42, 0.15],
    [0.02, -0.42, 0.76, 1.24, 0.08, 0.13],
    [0.72, -0.35, 0.34, 0.95, 0.82, 0.1],
  ] as const;

  return (
    <group position={[centerX, centerY, -0.18]} scale={scale}>
      {petals.map(([x, y, w, h, rotation, opacity], index) => (
        <mesh
          key={`${x}-${y}-${index}`}
          position={[x, y, 0]}
          rotation-z={rotation}
          scale={[w, h, 1]}
        >
          <circleGeometry args={[0.5, 48]} />
          <meshBasicMaterial
            color="#e9f2ef"
            transparent
            opacity={opacity}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
      {petals.map(([x, y, w, h, rotation], index) => (
        <group
          key={`vein-${x}-${y}-${index}`}
          position={[x, y, 0.012]}
          rotation-z={rotation}
          scale={[w, h, 1]}
        >
          <mesh>
            <planeGeometry args={[0.018, 0.72]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.18}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
          <mesh position={[0.09, 0.05, 0]} rotation-z={0.28}>
            <planeGeometry args={[0.01, 0.46]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
          <mesh position={[-0.1, 0.03, 0]} rotation-z={-0.28}>
            <planeGeometry args={[0.01, 0.42]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0.02, 0.02, 0.03]} scale={[0.32, 0.32, 1]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial
          color="#0b0b09"
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.45, -1.35, 0]} rotation-z={-0.23}>
        <planeGeometry args={[0.04, 2.6]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}

function FlowerVideoPlane({
  centerX,
  centerY,
  flowerVideo,
  height,
  width,
}: {
  centerX: number;
  centerY: number;
  flowerVideo: FlowerVideoState;
  height: number;
  width: number;
}) {
  const { texture, ready } = flowerVideo;

  if (!texture || !ready) {
    return (
      <FlowerMotif
        centerX={centerX}
        centerY={centerY}
        scale={Math.min(width, height) * 0.32}
      />
    );
  }

  return (
    <mesh position={[centerX, centerY, -0.22]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        color="#dfe8e4"
        transparent
        opacity={0.82}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function HeroObjects({
  size,
  flowerVideo,
  progress,
}: {
  size: Size;
  flowerVideo: FlowerVideoState;
  progress: number;
}) {
  const { viewport } = useThree();
  const mobile = size.width < 720;
  const w = viewport.width;
  const h = viewport.height;
  const left = -w / 2 + (mobile ? 0.36 : 0.72);
  const top = h / 2 - (mobile ? 0.34 : 0.46);
  const titleSize = mobile ? Math.min(0.5, w * 0.125) : 0.62;
  const bodySize = mobile ? 0.15 : 0.15;
  const titleTop = mobile ? top - 0.82 : top - 0.72;
  const bodyTop = titleTop - titleSize * (mobile ? 2.34 : 3.36);
  const ctaTop = bodyTop - (mobile ? 0.7 : 0.58);
  const cardTop = ctaTop - (mobile ? 0.84 : 0.92);
  const flowerHeight = mobile ? h * 1.12 : h * 1.1;
  const flowerWidth = flowerHeight * (flowerVideo.aspect ?? 2 / 3);
  const contentScrollY = progress * h * 3;
  const storyY = -h;
  const flowY = -h * 2;
  const capabilityY = -h * 3;

  return (
    <group>
      <mesh position={[0, 0, -0.55]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#050505" depthWrite={false} />
      </mesh>
      <mesh position={[w * 0.16, h * 0.2, -0.5]}>
        <planeGeometry args={[w * 0.9, h * 0.82]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.035}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <FlowerVideoPlane
        centerX={mobile ? w * 0.22 : w * 0.28}
        centerY={mobile ? h * 0.0 : -h * 0.02}
        flowerVideo={flowerVideo}
        width={flowerWidth}
        height={flowerHeight}
      />
      <mesh position={[-w * 0.18, 0, -0.38]}>
        <planeGeometry args={[w * 0.92, h]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.58} depthWrite={false} />
      </mesh>

      <group position={[0, contentScrollY, 0]}>
      <RoundedPanel
        position={[left + 0.3, top - 0.28, 0]}
        width={0.56}
        height={0.56}
        radius={0.28}
        opacity={0.04}
      />
      <LabelText position={[left + 0.22, top - 0.15, 0.04]} fontSize={0.25}>
        a
      </LabelText>

      {!mobile && (
        <>
          <RoundedPanel
            position={[left + 1.28, top - 0.28, 0]}
            width={1.65}
            height={0.42}
            radius={0.21}
            opacity={0.035}
          />
          <LabelText
            position={[left + 0.68, top - 0.18, 0.04]}
            fontSize={0.12}
            opacity={0.78}
          >
            WARDROBE PREVIEW
          </LabelText>
        </>
      )}

      <RoundedPanel
        position={[w / 2 - (mobile ? 0.7 : 0.78), top - 0.28, 0]}
        width={mobile ? 0.92 : 0.9}
        height={0.56}
        radius={0.28}
        opacity={0.04}
      />
      <LabelText
        position={[w / 2 - (mobile ? 0.95 : 1.02), top - 0.16, 0.04]}
        fontSize={mobile ? 0.16 : 0.15}
        opacity={0.92}
      >
        MENU
      </LabelText>

      <LabelText
        position={[left, titleTop, 0.02]}
        fontSize={titleSize}
        maxWidth={mobile ? w - 0.76 : Math.min(w * 0.58, 6.4)}
      >
        {mobile ? "Put your wardrobe in.\nDress today." : "Put your\nwardrobe in.\nDress today."}
      </LabelText>
      <LabelText
        position={[left, bodyTop, 0.02]}
        fontSize={bodySize}
        opacity={0.7}
        maxWidth={mobile ? w - 0.76 : Math.min(w * 0.55, 5.8)}
      >
        {mobile
          ? "An AI styling tool for fashion creators. Upload yourself and your clothes, set today's color and style, then build a look."
          : "An AI styling tool for fashion creators. Upload yourself and your clothes, set today's color and style, then build a complete look like a dress-up game."}
      </LabelText>

      <RoundedPanel
        position={[left + (mobile ? 0.88 : 0.98), ctaTop - 0.2, 0]}
        width={mobile ? 1.76 : 1.96}
        height={0.46}
        radius={0.23}
        opacity={0.12}
        strokeOpacity={0.38}
      />
      <LabelText
        position={[left + 0.22, ctaTop - 0.08, 0.04]}
        fontSize={mobile ? 0.14 : 0.13}
        opacity={0.95}
      >
        Start styling ↗
      </LabelText>

      {!mobile && (
        <LabelText
          position={[left + 2.42, ctaTop - 0.08, 0.04]}
          fontSize={0.13}
          opacity={0.76}
        >
          ▶  Manage wardrobe
        </LabelText>
      )}

      {[
        ["Color first", "Sort pieces by today's palette."],
        ["Style filter", "Street, clean fit, old money, vintage."],
      ].map(([title, body], index) => {
        const cardWidth = mobile ? w - 0.76 : 2.25;
        const cardHeight = mobile ? 0.6 : 0.78;
        const x = mobile ? left + cardWidth / 2 : left + cardWidth / 2 + index * 2.46;
        const y = mobile ? cardTop - index * 0.72 : cardTop;

        return (
          <group key={title}>
            <RoundedPanel
              position={[x, y - cardHeight / 2, 0]}
              width={cardWidth}
              height={cardHeight}
              radius={mobile ? 0.22 : 0.24}
              opacity={0.052}
              strokeOpacity={0.28}
            />
            <LabelText
              position={[x - cardWidth / 2 + 0.22, y - 0.14, 0.04]}
              fontSize={mobile ? 0.24 : 0.26}
              opacity={0.96}
            >
              {title}
            </LabelText>
            {!mobile && (
              <LabelText
                position={[x - cardWidth / 2 + 0.24, y - 0.47, 0.04]}
                fontSize={0.08}
                opacity={0.58}
              >
                {body}
              </LabelText>
            )}
          </group>
        );
      })}

      <group position={[0, storyY, 0]}>
        <LabelText
          position={[left, top - 0.86, 0.04]}
          fontSize={mobile ? 0.09 : 0.11}
          opacity={0.48}
        >
          WARDROBE STYLING
        </LabelText>
        <LabelText
          position={[left, top - 1.18, 0.04]}
          fontSize={mobile ? 0.35 : 0.52}
          maxWidth={mobile ? w - 0.75 : Math.min(w * 0.62, 6)}
        >
          {"Color first.\nStyle next.\nChoose from your own closet."}
        </LabelText>
        <RoundedPanel
          position={[
            mobile ? left + (w - 0.76) / 2 : left + 3.45,
            top - (mobile ? 4.22 : 3.86),
            0,
          ]}
          width={mobile ? w - 0.76 : 4.7}
          height={mobile ? 1.28 : 1.36}
          radius={0.28}
          opacity={0.055}
          strokeOpacity={0.25}
        />
        <LabelText
          position={[
            mobile ? left + 0.24 : left + 1.22,
            top - (mobile ? 3.68 : 3.3),
            0.05,
          ]}
          fontSize={mobile ? 0.13 : 0.14}
          opacity={0.68}
          maxWidth={mobile ? w - 1.2 : 4}
        >
          Creators upload themselves and the clothes they actually wear. Each day starts with a palette and a style filter, then the wardrobe becomes a playable selection system.
        </LabelText>
      </group>

      <group position={[0, flowY, 0]}>
        <LabelText
          position={[left, top - 0.78, 0.04]}
          fontSize={mobile ? 0.09 : 0.11}
          opacity={0.48}
        >
          STYLING FLOW
        </LabelText>
        {[
          ["01", "Build the closet", "Upload portrait and daily pieces. Tag category, color, and style."],
          ["02", "Set\nthe direction", "Pick today's color first, then narrow the mood before choosing clothes."],
          ["03", "Dress\nand preview", "Select inner, top, pants, shoes, socks, and optional accessories."],
        ].map(([index, title, body], itemIndex) => {
          const sectionCardWidth = mobile ? w - 0.76 : 2.38;
          const sectionCardHeight = mobile ? 1.28 : 2.38;
          const x = mobile
            ? left + sectionCardWidth / 2
            : left + sectionCardWidth / 2 + itemIndex * (sectionCardWidth + 0.32);
          const y = mobile ? top - 1.72 - itemIndex * 1.34 : top - 2.35;

          return (
            <group key={index}>
              <RoundedPanel
                position={[x, y - sectionCardHeight / 2, 0]}
                width={sectionCardWidth}
                height={sectionCardHeight}
                radius={0.25}
                opacity={0.052}
                strokeOpacity={0.28}
              />
              <LabelText
                position={[x - sectionCardWidth / 2 + 0.22, y - 0.18, 0.05]}
                fontSize={mobile ? 0.22 : 0.28}
                opacity={0.94}
              >
                {index}
              </LabelText>
              <LabelText
                position={[
                  x - sectionCardWidth / 2 + 0.22,
                  y - (mobile ? 0.48 : 1.04),
                  0.05,
                ]}
                fontSize={mobile ? 0.22 : 0.26}
                opacity={0.98}
                maxWidth={sectionCardWidth - 0.44}
              >
                {title}
              </LabelText>
              <LabelText
                position={[
                  x - sectionCardWidth / 2 + 0.23,
                  y - (mobile ? 0.96 : 1.78),
                  0.05,
                ]}
                fontSize={mobile ? 0.08 : 0.07}
                opacity={0.58}
                maxWidth={sectionCardWidth - 0.5}
              >
                {body}
              </LabelText>
            </group>
          );
        })}
      </group>

      <group position={[0, capabilityY, 0]}>
        <LabelText
          position={[left, top - 0.78, 0.04]}
          fontSize={mobile ? 0.09 : 0.11}
          opacity={0.48}
        >
          WHY IT HELPS
        </LabelText>
        {[
          ["Portrait base", "Every preview keeps the same body, pose, and camera mood."],
          ["Wardrobe filter", "Your closet is ranked by the color and style you chose first."],
          ["Game selection", "Choose each slot like a dress-up game, then generate the look."],
        ].map(([title, body], itemIndex) => {
          const sectionCardWidth = mobile ? w - 0.76 : 2.55;
          const sectionCardHeight = mobile ? 1.1 : 1.65;
          const x = mobile
            ? left + sectionCardWidth / 2
            : left + sectionCardWidth / 2 + itemIndex * (sectionCardWidth + 0.24);
          const y = mobile ? top - 1.64 - itemIndex * 1.24 : top - 2.35;

          return (
            <group key={title}>
              <RoundedPanel
                position={[x, y - sectionCardHeight / 2, 0]}
                width={sectionCardWidth}
                height={sectionCardHeight}
                radius={0.26}
                opacity={0.048}
                strokeOpacity={0.27}
              />
              <LabelText
                position={[x - sectionCardWidth / 2 + 0.22, y - 0.28, 0.05]}
                fontSize={mobile ? 0.24 : 0.32}
                opacity={0.98}
                maxWidth={sectionCardWidth - 0.44}
              >
                {title}
              </LabelText>
              <LabelText
                position={[
                  x - sectionCardWidth / 2 + 0.23,
                  y - (mobile ? 0.64 : 0.76),
                  0.05,
                ]}
                fontSize={mobile ? 0.09 : 0.085}
                opacity={0.6}
                maxWidth={sectionCardWidth - 0.5}
              >
                {body}
              </LabelText>
            </group>
          );
        })}
      </group>
      </group>
    </group>
  );
}

const FluidHero = memo(function FluidHero({
  size,
  progress,
}: {
  size: Size;
  progress: number;
}) {
  const lensRef = useRef<THREE.Mesh>(null);
  const pointerRef = useRef({ x: size.width < 720 ? 0.5 : 0.36, y: 0.46 });
  const { nodes } = useGLTF("/assets/3d/lens.glb") as unknown as LensGlb;
  const buffer = useFBO({ samples: 1 });
  const { gl, camera, viewport } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const flowerVideo = useFlowerVideoTexture();

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame((_, delta) => {
    const lens = lensRef.current;
    if (!lens) return;

    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    const targetX = (pointerRef.current.x - 0.5) * v.width;
    const targetY = (0.5 - pointerRef.current.y) * v.height;

    easing.damp3(lens.position, [targetX, targetY, 15], 0.09, delta);
    easing.damp(lens.rotation, "z", targetX * 0.025, 0.16, delta);

    gl.setRenderTarget(buffer);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  const geometry = nodes.Cylinder?.geometry;
  if (!geometry) return null;

  return (
    <>
      {createPortal(
        <>
          <color attach="background" args={["#050505"]} />
          <HeroObjects size={size} flowerVideo={flowerVideo} progress={progress} />
        </>,
        scene,
      )}
      <HeroObjects size={size} flowerVideo={flowerVideo} progress={progress} />
      <mesh
        ref={lensRef}
        geometry={geometry}
        scale={size.width < 720 ? 0.19 : 0.27}
        rotation-x={Math.PI / 2}
        renderOrder={10}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          transmission={1}
          roughness={0}
          thickness={2.35}
          ior={1.18}
          chromaticAberration={0.075}
          anisotropy={0.018}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.01}
          attenuationColor="#ffffff"
          attenuationDistance={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Preload />
    </>
  );
});

useGLTF.preload("/assets/3d/lens.glb");

export default function HomeGlassCursor() {
  const size = useViewportSize();
  const { sectionRef, progress } = useScrollProgress();

  return (
    <section
      ref={sectionRef}
      className="relative z-10 h-[400dvh] min-h-[2560px] bg-black"
    >
      <span id="story" className="absolute top-[100dvh]" aria-hidden="true" />
      <span id="process" className="absolute top-[200dvh]" aria-hidden="true" />
      <span id="capabilities" className="absolute top-[300dvh]" aria-hidden="true" />
      <div className="fixed inset-0 h-[100dvh] min-h-[640px] overflow-hidden [&_canvas]:!h-full [&_canvas]:!w-full">
        <Canvas
          camera={{ position: [0, 0, 20], fov: 15 }}
          gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
          dpr={[1, 1.25]}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <FluidHero size={size} progress={progress} />
        </Canvas>
      </div>
      <nav
        aria-label="Hero actions"
        className={`fixed inset-0 z-20 transition-opacity duration-300 ${
          progress < 0.18 ? "pointer-events-none opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <a
          aria-label="Start styling"
          className="pointer-events-auto absolute left-[7%] top-[68%] h-14 w-[15.5rem] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-[7%] sm:top-[66%]"
          href="/auth/register"
        />
        <a
          aria-label="Manage wardrobe"
          className="pointer-events-auto absolute left-[7%] top-[78%] h-12 w-[14rem] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-[25%] sm:top-[67%]"
          href="/profile"
        />
        <a
          aria-label="Open menu"
          className="pointer-events-auto absolute right-[5%] top-[3%] h-16 w-24 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          href="#story"
        />
      </nav>
      <div className="sr-only">
        <h1>Put your wardrobe in. Dress today.</h1>
        <p>
          An AI styling tool for fashion creators. Upload yourself and your clothes,
          set today&apos;s color and style, then build a complete look.
        </p>
        <a href="/auth/register">Start styling</a>
        <a href="/profile">Manage wardrobe</a>
        <h2>Wardrobe Styling</h2>
        <p>
          Creators upload themselves and the clothes they actually wear. Each day
          starts with a palette and a style filter, then the wardrobe becomes a
          playable selection system.
        </p>
        <h2>Styling Flow</h2>
        <p>Build the closet. Set the direction. Dress and preview.</p>
        <h2>Why it helps</h2>
        <p>Portrait base, wardrobe filter, and game selection in one flow.</p>
      </div>
    </section>
  );
}
