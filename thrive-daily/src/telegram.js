// Thin wrapper around the Telegram WebApp global injected by
// https://telegram.org/js/telegram-web-app.js (loaded in index.html).
// Falls back to no-ops gracefully when running in a normal browser
// (e.g. local dev, Netlify preview) so the app never blank-screens.

function getWebApp() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export function initTelegram() {
  const wa = getWebApp()
  if (!wa) return

  try {
    wa.ready()
    wa.expand()

    // Full-screen support (Bot API 8.0+), guarded for older clients
    if (typeof wa.requestFullscreen === 'function') {
      try { wa.requestFullscreen() } catch (_) { /* older client, ignore */ }
    }

    if (typeof wa.disableVerticalSwipes === 'function') {
      wa.disableVerticalSwipes()
    }

    applyThemeColors(wa)
    wa.onEvent && wa.onEvent('themeChanged', () => applyThemeColors(wa))

    // Safe area insets → CSS variables, with sensible fallbacks for iPhone notch/home bar
    const applyInsets = () => {
      const insets = wa.safeAreaInset || { top: 0, right: 0, bottom: 0, left: 0 }
      const content = wa.contentSafeAreaInset || { top: 0, right: 0, bottom: 0, left: 0 }
      const root = document.documentElement.style
      root.setProperty('--tg-safe-top', `${(insets.top || 0) + (content.top || 0)}px`)
      root.setProperty('--tg-safe-bottom', `${(insets.bottom || 0) + (content.bottom || 0)}px`)
      root.setProperty('--tg-safe-left', `${(insets.left || 0) + (content.left || 0)}px`)
      root.setProperty('--tg-safe-right', `${(insets.right || 0) + (content.right || 0)}px`)
    }
    applyInsets()
    wa.onEvent && wa.onEvent('safeAreaChanged', applyInsets)
    wa.onEvent && wa.onEvent('contentSafeAreaChanged', applyInsets)
  } catch (err) {
    console.warn('Telegram WebApp init warning:', err)
  }
}

function applyThemeColors(wa) {
  try {
    wa.setHeaderColor && wa.setHeaderColor('#F5F1E8')
    wa.setBackgroundColor && wa.setBackgroundColor('#F5F1E8')
  } catch (_) { /* ignore unsupported client */ }
}

export function hapticImpact(style = 'light') {
  const wa = getWebApp()
  if (wa && wa.HapticFeedback) {
    wa.HapticFeedback.impactOccurred(style)
  }
}

export function hapticNotification(type = 'success') {
  const wa = getWebApp()
  if (wa && wa.HapticFeedback) {
    wa.HapticFeedback.notificationOccurred(type)
  }
}

export function showBackButton(onClick) {
  const wa = getWebApp()
  if (!wa || !wa.BackButton) return () => {}
  wa.BackButton.show()
  wa.BackButton.onClick(onClick)
  return () => {
    wa.BackButton.offClick(onClick)
    wa.BackButton.hide()
  }
}

export function hideBackButton() {
  const wa = getWebApp()
  if (wa && wa.BackButton) wa.BackButton.hide()
}

export function getTelegramUser() {
  const wa = getWebApp()
  return wa && wa.initDataUnsafe ? wa.initDataUnsafe.user || null : null
}

export function closeApp() {
  const wa = getWebApp()
  if (wa) wa.close()
}

export function isInTelegram() {
  return !!getWebApp()
}
