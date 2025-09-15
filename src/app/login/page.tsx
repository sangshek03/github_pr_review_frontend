"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { authApi, type LoginRequest, type SignUpRequest } from "@/api"
import ThemeToggle from "@/components/ui/ThemeToggle"

interface FormData {
  email: string
  password: string
  f_name?: string
  l_name?: string
  phone?: string
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    f_name: '',
    l_name: '',
    phone: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error and success message when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (isSignUp) {
      if (!formData.f_name) newErrors.f_name = 'First name is required'
      if (!formData.l_name) newErrors.l_name = 'Last name is required'
      if (!formData.phone) newErrors.phone = 'Phone number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (isSignUp) {
        // Sign up flow
        const signUpData: SignUpRequest = {
          f_name: formData.f_name!,
          l_name: formData.l_name!,
          email: formData.email,
          phone: formData.phone!,
          password: formData.password
        }

        await authApi.signUp(signUpData)

        // Show success message and switch to login
        setSuccessMessage('Account created successfully! Please log in with your credentials.')
        setIsSignUp(false)
        setFormData({
          email: formData.email, // Keep email for convenience
          password: '',
          f_name: '',
          l_name: '',
          phone: ''
        })
        setErrors({})
      } else {
        // Login flow
        const loginData: LoginRequest = {
          email: formData.email,
          password: formData.password
        }

        await authApi.login(loginData)

        // For login, redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Error during authentication:', error)
      setErrors({ email: error.message || 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      window.location.href = authApi.getGoogleAuthUrl()
    } catch (error) {
      console.error('Error during Google sign in:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-secondary/20 to-primary/20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-surface/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-divider/50 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {isSignUp ? 'Join Github PR Agent' : 'Welcome To Github PR AGENT'}
              </h1>
              <p className="text-text-secondary">
                {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="f_name"
                      placeholder="First Name"
                      value={formData.f_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-divider bg-surface/50 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                    />
                    {errors.f_name && <p className="text-red-500 text-xs mt-1">{errors.f_name}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="l_name"
                      placeholder="Last Name"
                      value={formData.l_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-divider bg-surface/50 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                    />
                    {errors.l_name && <p className="text-red-500 text-xs mt-1">{errors.l_name}</p>}
                  </div>
                </div>
              )}

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-surface/50 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {isSignUp && (
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-surface/50 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              )}

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-surface/50 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-divider"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-text-secondary">or</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full group relative overflow-hidden rounded-xl p-3 bg-surface/50 border-2 border-divider hover:border-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-text-primary">
                  Continue with Google
                </span>
              </div>
            </button>

            {/* Toggle Sign Up/Sign In */}
            <div className="mt-6 text-center">
              <p className="text-text-secondary text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setFormData({
                      email: '',
                      password: '',
                      f_name: '',
                      l_name: '',
                      phone: ''
                    })
                    setErrors({})
                    setSuccessMessage('')
                  }}
                  className="text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-text-secondary">
                By continuing, you agree to our{' '}
                <a href="#" className="text-primary hover:text-primary-hover transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:text-primary-hover transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-text-secondary">
              Streamline your code reviews with AI-powered insights
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}