import { useUser } from "@/entities/user/api/queries.ts"
import React, { useEffect, useState } from "react"
import { setAuthFailureCallback } from "@/shared/api/instance.api.ts"

interface Props {
  children: React.ReactNode
}

export function AuthProvider({ children }: Props) {
  const { data: user, isLoading, error } = useUser()
  const [authFailureError, setAuthFailureError] = useState<Error | null>(null)

  useEffect(() => {
    const isAccountDeleted = sessionStorage.getItem("account.deleted") === "true"

    if (user || isAccountDeleted) {
      const splashScreen = document.querySelector("#hydration-screen")
      if (splashScreen) {
        splashScreen.remove()
      }
    }
  }, [user, isLoading])

  useEffect(() => {
    setAuthFailureCallback((err) => {
      setAuthFailureError(err)
    })
  }, [])

  if (authFailureError) {
    throw authFailureError
  }

  if (error) {
    throw new Error(`Failed to load user: ${error.message || "Unknown error"}`)
  }

  return children
}
