import { Zap } from "lucide-react"

export default function LoginLogo({ size = 64 }) {
  return (
    <div className={`relative flex items-center justify-center`} style={{ height: size, width: size }}>
      {/* Outer circle */}
      <div className="absolute rounded-full bg-gradient-to-r from-purple-600 to-pink-500 opacity-80" 
           style={{ height: size, width: size }}></div>

      {/* Middle circle */}
      <div className="absolute rounded-full bg-gradient-to-r from-purple-500 to-pink-400 opacity-80" 
           style={{ height: size * 0.875, width: size * 0.875 }}></div>

      {/* Inner circle */}
      <div className="absolute rounded-full bg-gradient-to-r from-purple-400 to-pink-300 opacity-80" 
           style={{ height: size * 0.75, width: size * 0.75 }}></div>

      {/* White background for the icon */}
      <div className="absolute rounded-full bg-white" 
           style={{ height: size * 0.625, width: size * 0.625 }}></div>

      {/* Lightning bolt icon */}
      <div className="relative z-10">
        <Zap size={size * 0.3125} className="text-red-800" />
      </div>
    </div>
  );
}
