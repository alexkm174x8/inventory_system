import { Zap } from "lucide-react"

export default function LoginLogo() {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      {/* Outer circle */}
      <div className="absolute h-64 w-64 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 opacity-80"></div>

      {/* Middle circle */}
      <div className="absolute h-56 w-56 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 opacity-80"></div>

      {/* Inner circle */}
      <div className="absolute h-48 w-48 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 opacity-80"></div>

      {/* White background for the icon */}
      <div className="absolute h-40 w-40 rounded-full bg-white"></div>

      {/* Lightning bolt icon */}
      <div className="relative z-10">
        <Zap size={80} className="text-red-800" />
      </div>
    </div>
  )
}