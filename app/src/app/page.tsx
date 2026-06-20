import HomeGlassCursor from "@/components/home/HomeGlassCursor";

export default function Home() {
  return (
    <main className="lux-page relative overflow-x-hidden text-white">
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed h-0 w-0 overflow-hidden"
        focusable="false"
      >
        <filter
          id="lux-title-ripple"
          x="-35%"
          y="-55%"
          width="170%"
          height="210%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.075"
            numOctaves="2"
            seed="11"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="4.8s"
              repeatCount="indefinite"
              values="0.014 0.065;0.03 0.045;0.018 0.075"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="5.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter
          id="lux-edge-ripple"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.05"
            numOctaves="2"
            seed="21"
            result="edgeNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="edgeNoise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </svg>
      <HomeGlassCursor />
    </main>
  );
}
