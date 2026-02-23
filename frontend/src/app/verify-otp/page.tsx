"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

function VerifyOTPContent() {
    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email")

    useEffect(() => {
        if (!email) {
            router.push("/login")
        }
    }, [email, router])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, otp }),
            })

            if (response.ok) {
                // Success! Redirect to dashboard
                router.push("/login?verified=true")
            } else {
                const data = await response.json()
                setError(data.detail || "Invalid OTP. Please try again.")
            }
        } catch (err) {
            setError("Something went wrong. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        setError("")
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            if (response.ok) {
                alert("OTP resent to your email!")
            } else {
                setError("Failed to resend OTP.")
            }
        } catch (err) {
            setError("Failed to resend OTP.")
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-[#1E293B] p-8 rounded-2xl shadow-2xl border border-white/10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
                    <p className="text-slate-400">
                        We've sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                            Enter OTP
                        </label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        Didn't receive the code?{" "}
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                        >
                            {resending ? "Resending..." : "Resend"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
                <div className="text-white animate-pulse">Loading verification...</div>
            </div>
        }>
            <VerifyOTPContent />
        </Suspense>
    )
}
