"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LoginLogo from "@/components/login-logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
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
      console.log("Login attempted with:", { email, password })
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 md:flex-row md:items-start md:gap-16">
        <div className="flex flex-col items-center">
          <LoginLogo />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Bienvenido a TradeHub</h1>
            <p className="text-sm text-muted-foreground">Ingresa con tu datos personales.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="text"
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError("")
                }}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError("")
                }}
                className={passwordError ? "border-red-500" : ""}
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              <div className="text-right">
                <Link href="#" className="text-xs text-blue-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
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

