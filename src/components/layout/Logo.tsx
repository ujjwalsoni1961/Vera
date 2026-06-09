export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="url(#vera-grad)" />
      <path
        d="M9 9.5L16 22.5L23 9.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="1.9" fill="white" />
      <defs>
        <linearGradient
          id="vera-grad"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10b88a" />
          <stop offset="1" stopColor="#069471" />
        </linearGradient>
      </defs>
    </svg>
  );
}
