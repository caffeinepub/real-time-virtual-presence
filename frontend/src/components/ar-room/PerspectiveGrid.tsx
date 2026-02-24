export default function PerspectiveGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Perspective grid floor */}
      <g opacity="0.6">
        {/* Horizontal lines with perspective */}
        {[0.5, 0.6, 0.7, 0.8, 0.9].map((y, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={`${y * 100}%`}
            x2="100%"
            y2={`${y * 100}%`}
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="2"
          />
        ))}

        {/* Vertical lines with perspective convergence */}
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((x, i) => (
          <line
            key={`v-${i}`}
            x1={`${x * 100}%`}
            y1="50%"
            x2={`${50 + (x - 0.5) * 20}%`}
            y2="100%"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="2"
          />
        ))}

        {/* Floor guide line */}
        <line
          x1="0"
          y1="80%"
          x2="100%"
          y2="80%"
          stroke="rgba(255, 150, 0, 0.6)"
          strokeWidth="3"
          strokeDasharray="10,5"
        />
        <text x="50%" y="78%" textAnchor="middle" fill="rgba(255, 150, 0, 0.8)" fontSize="14" fontWeight="bold">
          Floor Guide
        </text>
      </g>
    </svg>
  );
}
