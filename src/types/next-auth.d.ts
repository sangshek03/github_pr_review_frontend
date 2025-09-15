import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    backendUser?: any
  }

  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      backendUser?: any
    }
  }
}