type WidgetApi = {
  destroy?: () => void
}

function removeLiraStorageKeys(storage: Storage | null): void {
  if (!storage) return

  const keys: string[] = []
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i)
    if (
      key &&
      (key === 'lira_visitor_id' ||
        key === 'lira_visitor_id_session' ||
        key.startsWith('lira_chat_') ||
        key.startsWith('lira_widget_dismissed_'))
    ) {
      keys.push(key)
    }
  }

  for (const key of keys) {
    storage.removeItem(key)
  }
}

export function resetLiraWidgetSession(): void {
  if (typeof window === 'undefined') return

  const api = window as unknown as {
    Lira?: WidgetApi
    LiraWidget?: WidgetApi
    LiraWidgetConfig?: unknown
  }

  try {
    api.Lira?.destroy?.()
  } catch {
    /* widget already gone */
  }

  try {
    api.LiraWidget?.destroy?.()
  } catch {
    /* widget already gone */
  }

  try {
    removeLiraStorageKeys(window.localStorage)
  } catch {
    /* storage unavailable */
  }

  try {
    removeLiraStorageKeys(window.sessionStorage)
  } catch {
    /* storage unavailable */
  }

  document
    .querySelectorAll<HTMLElement>(
      [
        '#lira-support-widget',
        '#lira-public-site-widget-script',
        '#lira-onboarding-widget-script',
        '#lira-support-widget-loader',
        '[id^="lira-widget"]',
        '[id^="lira-support"]',
      ].join(',')
    )
    .forEach((el) => el.remove())

  delete api.LiraWidget
  delete api.Lira
  delete api.LiraWidgetConfig
}
