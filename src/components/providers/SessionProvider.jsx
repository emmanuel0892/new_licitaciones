"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

const SessionProvider = ({ children, session }) => {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}

export default SessionProvider
