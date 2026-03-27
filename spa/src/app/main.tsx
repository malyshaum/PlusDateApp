import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { GoogleTagManagerProvider } from "@tracktor/react-google-tag-manager"
import App from "./App.tsx"
import "./localization/i18n"
import { initTgSDK } from "@/app/init.ts"
import { retrieveLaunchParams, retrieveRawInitData } from "@tma.js/sdk-react"
import { AuthProvider } from "@/app/providers/AuthProvider.tsx"
import { SocketProvider } from "@/app/providers/SocketProvider.tsx"
import { ErrorBoundary } from "@/app/providers/ErrorBoundary.tsx"
import { PaymentProvider } from "@/app/providers/PaymentProvider.tsx"
import { env } from "@/shared/config/env.ts"
import Cookies from "js-cookie"
import { login, me } from "@/entities/user/api/user.api.ts"

if (import.meta.env.VITE_MODE === "testing") {
  const script = document.createElement("script")
  script.src = "https://cdn.jsdelivr.net/npm/eruda"
  script.onload = () => {
    // @ts-expect-error - eruda is loaded dynamically
    window.eruda?.init({
      defaults: {
        displaySize: 50,
        transparency: 0.9,
      },
    })
  }
  document.head.appendChild(script)
}

try {
  const launchParams = retrieveLaunchParams()
  const { tgWebAppPlatform: platform } = launchParams
  const initData = retrieveRawInitData()

  if (platform === "android") {
    document.documentElement.style.setProperty("--safe-padding", "24px")
  } else {
    document.documentElement.style.setProperty("--safe-padding", "0px")
  }

  const debug =
    (launchParams.tgWebAppStartParam || "").includes("platformer_debug") || import.meta.env.DEV

  if (initData) {
    await login({ query: initData }).then(async (res) => {
      if (res?.token) {
        Cookies.set("auth_token", res.token)
        const user = await me()
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({ campaign_id: user.start_param || "direct", user_id: user.id })
      }
      if (res?.message) {
        Cookies.remove("auth_token")
        sessionStorage.setItem("account.deleted", "true")
      }
    })
  }

  await initTgSDK({
    debug,
    mockForMacOS: platform === "macos",
    platform,
  }).then(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: "always",
          refetchOnMount: false,
          networkMode: "online",
        },
        mutations: {
          retry: false,
        },
      },
    })

    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <SocketProvider>
                  <PaymentProvider>
                    <GoogleTagManagerProvider id={env.gtm_token}>
                      <App />
                    </GoogleTagManagerProvider>
                  </PaymentProvider>
                </SocketProvider>
              </AuthProvider>
            </QueryClientProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>,
    )
  })
} catch (e) {
  console.error(e)
  // TODO logger
}
