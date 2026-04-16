interface Props {
  size?: number
}

export function PulseLogo({ size = 36 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <rect width="120" height="120" rx="18" fill="#110e1c"/>
      <rect width="120" height="120" rx="18" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6"/>
      <path d="M 30,68 A 22,22 0 0 1 52,90"
        stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 30,50 A 40,40 0 0 1 70,90"
        stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" opacity="0.65"/>
      <path d="M 30,30 A 60,60 0 0 1 90,90"
        stroke="#8b5cf6" strokeWidth="1.6" strokeLinecap="round" opacity="0.35"/>
      <circle cx="30" cy="90" r="5" fill="#8b5cf6"/>
    </svg>
  )
}
