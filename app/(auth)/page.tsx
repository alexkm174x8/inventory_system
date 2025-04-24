"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
// Import icons (assuming you use lucide-react, common with shadcn/ui)
import { Eye, EyeOff } from "lucide-react" 

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LoginLogo from "@/components/login-logo"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  // --- 1. Add state for password visibility ---
  const [showPassword, setShowPassword] = useState(false) 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setEmailError("")
    setPasswordError("")

    let isValid = true

    if (!email) {
      setEmailError("Por favor, ingresa tu correo electrónico")
      isValid = false
    } else if (!email.includes("@") || !email.includes(".")) {
      setEmailError("El correo electrónico debe contener @ y un dominio válido")
      isValid = false
    }

    if (!password) {
      setPasswordError("Por favor, ingresa tu contraseña")
      isValid = false
    }

    if (isValid) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error("Login error:", error)
          setPasswordError("Correo electrónico o contraseña incorrectos")
          return
        }

        if (data.user) {
          router.push("/menu")
        }
      } catch (error) {
        console.error("Login error:", error)
        setPasswordError("Error al iniciar sesión. Por favor, intenta de nuevo.")
      }
    }
  }

  // --- Helper function to toggle password visibility ---
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 md:flex-row md:items-start md:gap-16">
        <div className="flex flex-col items-center">
          <LoginLogo size={300} />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Bienvenido a TradeHub</h1>
            <p className="text-sm text-muted-foreground">Ingresa con tu datos personales.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-lg font-medium">
                Email
              </label>
              <Input
                id="email"
                // Consider using type="email" for better semantics and mobile keyboards
                type="email" 
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError("")
                }}
                className={emailError ? "border-red-500" : ""}
                // Add required attribute for basic HTML validation (optional)
                required
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>

            {/* --- Password Input Section --- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-lg font-medium">
                  Contraseña
                </label>
              </div>
              {/* --- Wrap Input and Button for positioning --- */}
              <div className="relative"> 
                <Input
                  id="password"
                  // --- 3. Dynamically set the type ---
                  type={showPassword ? "text" : "password"} 
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError("")
                  }}
                  // Add padding-right to prevent text from overlapping the icon
                  className={`${passwordError ? "border-red-500" : ""} pr-10`} 
                  required
                />
                {/* --- 2. Add the toggle button --- */}
                <Button
                  type="button" // Prevent form submission
                  variant="ghost" // Use ghost variant for less emphasis
                  size="icon" // Make it icon-sized
                  // --- Position the button inside the input field ---
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:text-gray-700" 
                  onClick={togglePasswordVisibility} // --- 4. Add onClick handler ---
                  aria-label={showPassword ? "Hide password" : "Show password"} // Accessibility
                >
                  {/* --- Conditionally render the icon --- */}
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* --- Error message and Forgot Password Link --- */}
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              <div className="text-right">
                <Link href="#" className="text-xs text-blue-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
            {/* --- Rest of the form --- */}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Iniciar Sesión
            </Button>
            <div className="text-center text-sm">
              ¿No tienes una cuenta?{" "}
              <Link href="#" className="text-blue-500 hover:underline">
                Contacta a un administrador.
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
