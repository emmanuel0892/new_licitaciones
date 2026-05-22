import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user || !user.password) {
          return null
        }

        if (user.active !== "active") {
          throw new Error("Usuario desactivado")
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
          return null
        }

        console.log("✅ Usuario autenticado:", { id: user.id, email: user.email, typeAccount: user.typeAccount })
        return {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          typeAccount: user.typeAccount,
          departamento: user.departamento,
          rut: user.rut
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.typeAccount = user.typeAccount
        token.departamento = user.departamento
        token.lastname = user.lastname
        token.rut = user.rut
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.typeAccount = token.typeAccount
        session.user.departamento = token.departamento
        session.user.lastname = token.lastname
        session.user.rut = token.rut
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.AUTH_SECRET
})
