import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { LiraClient, createClient } from './core'
import type { LiraActionHandler, LiraConfig, LiraContext, LiraVisitorIdentity } from './types'

type LiraReactContextValue = {
  client: LiraClient
}

type LiraProviderProps = {
  config: LiraConfig
  identity?: LiraVisitorIdentity
  context?: LiraContext
  scriptSrc?: string
  children?: ReactNode
}

type LiraSupportPageProps = {
  config?: Partial<LiraConfig>
  identity?: LiraVisitorIdentity
  context?: LiraContext
  className?: string
  style?: CSSProperties
}

type LiraWidgetProps = {
  config?: Partial<LiraConfig>
  identity?: LiraVisitorIdentity
  context?: LiraContext
}

const LiraReactContext = createContext<LiraReactContextValue | null>(null)

export function LiraProvider({
  config,
  identity,
  context,
  scriptSrc,
  children,
}: LiraProviderProps) {
  const client = useMemo(() => createClient({ scriptSrc }), [scriptSrc])

  useEffect(() => {
    void client.init(config)
    return () => client.destroy()
  }, [client, config])

  useEffect(() => {
    if (identity) void client.identify(identity)
  }, [client, identity])

  useEffect(() => {
    if (context) void client.setContext(context)
  }, [client, context])

  const value = useMemo(() => ({ client }), [client])

  return <LiraReactContext.Provider value={value}>{children}</LiraReactContext.Provider>
}

export function useLira(): LiraClient {
  const value = useContext(LiraReactContext)
  if (!value) {
    throw new Error('useLira must be used inside <LiraProvider>.')
  }
  return value.client
}

export function useLiraAction(
  name: string,
  handler: LiraActionHandler,
  options?: { description?: string }
): void {
  const client = useLira()

  useEffect(() => {
    return client.registerAction(name, handler, options)
  }, [client, name, handler, options])
}

export function LiraSupportPage({
  config,
  identity,
  context,
  className,
  style,
}: LiraSupportPageProps) {
  const client = useLira()
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (identity) void client.identify(identity)
  }, [client, identity])

  useEffect(() => {
    if (context) void client.setContext(context)
  }, [client, context])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let mounted = true
    let cleanup: (() => void) | undefined

    void client.mountSupportPage(host, config).then((instance) => {
      if (!mounted) {
        instance.destroy()
        return
      }
      cleanup = () => instance.destroy()
    })

    return () => {
      mounted = false
      cleanup?.()
    }
  }, [client, config])

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ minHeight: 640, width: '100%', ...style }}
      data-lira-support-page-host=""
    />
  )
}

export function LiraWidget({ config, identity, context }: LiraWidgetProps) {
  const client = useLira()

  useEffect(() => {
    if (identity) void client.identify(identity)
  }, [client, identity])

  useEffect(() => {
    if (context) void client.setContext(context)
  }, [client, context])

  useEffect(() => {
    let mounted = true
    let cleanup: (() => void) | undefined

    void client.mountWidget(config).then((instance) => {
      if (!mounted) {
        instance.destroy()
        return
      }
      cleanup = () => instance.destroy()
    })

    return () => {
      mounted = false
      cleanup?.()
    }
  }, [client, config])

  return null
}
