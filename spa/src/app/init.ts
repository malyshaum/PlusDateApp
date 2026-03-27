import {
  init,
  mockTelegramEnv,
  type ThemeParams,
  themeParams,
  retrieveLaunchParams,
  emitEvent,
  viewport,
  closingBehavior,
  requestWriteAccess,
  locationManager,
  backButton,
  swipeBehavior,
  postEvent,
  miniApp,
} from "@tma.js/sdk-react"

export async function initTgSDK(options: {
  debug: boolean
  mockForMacOS: boolean
  platform: string
}): Promise<void> {
  // setDebug(options.debug)
  init()

  // Information from "@tma.js/sdk-react" developers
  // Telegram for macOS has a ton of bugs, including cases, when the client doesn't
  // even response to the "web_app_request_theme" method. It also generates an incorrect
  // event for the "web_app_request_safe_area" method.
  if (options.mockForMacOS) {
    let firstThemeSent = false
    mockTelegramEnv({
      onEvent(event, next) {
        if (event.name === "web_app_request_theme") {
          let tp: ThemeParams = {}
          if (firstThemeSent) {
            tp = themeParams.state()
          } else {
            firstThemeSent = true
            tp ||= retrieveLaunchParams().tgWebAppThemeParams
          }
          return emitEvent("theme_changed", { theme_params: tp })
        }

        if (event.name === "web_app_request_safe_area") {
          return emitEvent("safe_area_changed", { left: 0, top: 0, right: 0, bottom: 0 })
        }

        next()
      },
    })
  }

  if (viewport.mount.isAvailable()) {
    await viewport.mount().then(async () => {
      if (options.platform !== "tdesktop" && viewport.requestFullscreen.isAvailable()) {
        await viewport.requestFullscreen()
      }
    })
  }

  if (miniApp.mount.isAvailable()) {
    miniApp.mount()
  }

  if (miniApp.setBgColor.isAvailable()) {
    miniApp.setBgColor("#181818")
  }

  if (viewport.bindCssVars.isAvailable()) {
    viewport.bindCssVars()
  }

  try {
    postEvent("web_app_toggle_orientation_lock", { locked: true })
  } catch (err) {
    console.log("Orientation lock not available:", err)
  }

  if (closingBehavior.mount.isAvailable()) {
    closingBehavior.mount()
    if (closingBehavior.enableConfirmation.isAvailable()) {
      closingBehavior.enableConfirmation()
    }
  }

  const requestAccessRecursively = async (): Promise<void> => {
    if (requestWriteAccess.isAvailable()) {
      const granted = await requestWriteAccess()
      if (granted) {
        console.log("Access granted!")
      } else {
        console.log("Access denied, requesting again...")
        await requestAccessRecursively()
      }
    }
  }

  await requestAccessRecursively()

  if (locationManager.mount.isAvailable()) {
    try {
      await locationManager.mount()
    } catch (err) {
      console.log(err)
      // TODO logger
    }
  }

  if (backButton.mount.isAvailable()) {
    backButton.mount()
  }

  if (swipeBehavior.mount.isAvailable()) {
    swipeBehavior.mount()
    if (swipeBehavior.disableVertical.isAvailable()) {
      swipeBehavior.disableVertical()
    }
  }
}
