import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json()

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }),
        })

        const data = await response.json()

        if (response.ok) {
            return NextResponse.json(data)
        } else {
            return NextResponse.json(data, { status: response.status })
        }
    } catch (error) {
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 })
    }
}
