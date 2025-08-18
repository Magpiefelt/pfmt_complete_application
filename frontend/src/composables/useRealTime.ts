import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

export interface RealTimeOptions {
  url?: string
  protocols?: string | string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  debug?: boolean
}

export interface RealTimeMessage {
  type: string
  data: any
  timestamp: number
  id?: string
}

export interface ConnectionState {
  connected: boolean
  connecting: boolean
  reconnecting: boolean
  error: string | null
  reconnectAttempts: number
  lastConnected: number | null
  latency: number | null
}

/**
 * Composable for real-time updates via WebSocket
 * Provides connection management, message handling, and automatic reconnection
 */
export function useRealTime(options: RealTimeOptions = {}) {
  const {
    url = '',
    protocols,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    debug = false
  } = options

  // State
  const socket = ref<WebSocket | null>(null)
  const connectionState = ref<ConnectionState>({
    connected: false,
    connecting: false,
    reconnecting: false,
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
    latency: null
  })

  const messageQueue = ref<RealTimeMessage[]>([])
  const subscribers = ref<Map<string, Set<(data: any) => void>>>(new Map())
  const heartbeatTimer = ref<NodeJS.Timeout | null>(null)
  const reconnectTimer = ref<NodeJS.Timeout | null>(null)
  const pingTime = ref<number | null>(null)

  // Computed
  const isConnected = computed(() => connectionState.value.connected)
  const isConnecting = computed(() => connectionState.value.connecting)
  const isReconnecting = computed(() => connectionState.value.reconnecting)
  const hasError = computed(() => !!connectionState.value.error)
  const canReconnect = computed(() => 
    connectionState.value.reconnectAttempts < maxReconnectAttempts
  )

  // Logging utility
  const log = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[RealTime] ${message}`, ...args)
    }
  }

  // Connect to WebSocket
  const connect = (wsUrl?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const targetUrl = wsUrl || url
      
      if (!targetUrl) {
        const error = 'WebSocket URL is required'
        connectionState.value.error = error
        reject(new Error(error))
        return
      }

      if (socket.value?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      log('Connecting to', targetUrl)
      connectionState.value.connecting = true
      connectionState.value.error = null

      try {
        socket.value = new WebSocket(targetUrl, protocols)

        socket.value.onopen = () => {
          log('Connected')
          connectionState.value.connected = true
          connectionState.value.connecting = false
          connectionState.value.reconnecting = false
          connectionState.value.reconnectAttempts = 0
          connectionState.value.lastConnected = Date.now()
          connectionState.value.error = null

          startHeartbeat()
          processMessageQueue()
          resolve()
        }

        socket.value.onmessage = (event) => {
          handleMessage(event.data)
        }

        socket.value.onclose = (event) => {
          log('Disconnected', event.code, event.reason)
          connectionState.value.connected = false
          connectionState.value.connecting = false
          stopHeartbeat()

          if (!event.wasClean && canReconnect.value) {
            scheduleReconnect()
          }
        }

        socket.value.onerror = (error) => {
          log('Error', error)
          connectionState.value.error = 'Connection error'
          connectionState.value.connecting = false
          reject(error)
        }
      } catch (error) {
        connectionState.value.error = 'Failed to create WebSocket connection'
        connectionState.value.connecting = false
        reject(error)
      }
    })
  }

  // Disconnect from WebSocket
  const disconnect = () => {
    log('Disconnecting')
    
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }

    stopHeartbeat()

    if (socket.value) {
      socket.value.close(1000, 'Client disconnect')
      socket.value = null
    }

    connectionState.value.connected = false
    connectionState.value.connecting = false
    connectionState.value.reconnecting = false
  }

  // Send message
  const send = (type: string, data: any): boolean => {
    const message: RealTimeMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: generateMessageId()
    }

    if (isConnected.value && socket.value) {
      try {
        socket.value.send(JSON.stringify(message))
        log('Sent message', message)
        return true
      } catch (error) {
        log('Failed to send message', error)
        queueMessage(message)
        return false
      }
    } else {
      queueMessage(message)
      return false
    }
  }

  // Queue message for later sending
  const queueMessage = (message: RealTimeMessage) => {
    messageQueue.value.push(message)
    log('Queued message', message)
  }

  // Process queued messages
  const processMessageQueue = () => {
    if (!isConnected.value || !socket.value) return

    const messages = [...messageQueue.value]
    messageQueue.value = []

    messages.forEach(message => {
      try {
        socket.value!.send(JSON.stringify(message))
        log('Sent queued message', message)
      } catch (error) {
        log('Failed to send queued message', error)
        queueMessage(message)
      }
    })
  }

  // Handle incoming message
  const handleMessage = (rawData: string) => {
    try {
      const message: RealTimeMessage = JSON.parse(rawData)
      log('Received message', message)

      // Handle pong response
      if (message.type === 'pong' && pingTime.value) {
        connectionState.value.latency = Date.now() - pingTime.value
        pingTime.value = null
        return
      }

      // Notify subscribers
      const typeSubscribers = subscribers.value.get(message.type)
      if (typeSubscribers) {
        typeSubscribers.forEach(callback => {
          try {
            callback(message.data)
          } catch (error) {
            log('Subscriber error', error)
          }
        })
      }

      // Notify wildcard subscribers
      const wildcardSubscribers = subscribers.value.get('*')
      if (wildcardSubscribers) {
        wildcardSubscribers.forEach(callback => {
          try {
            callback(message)
          } catch (error) {
            log('Wildcard subscriber error', error)
          }
        })
      }
    } catch (error) {
      log('Failed to parse message', error, rawData)
    }
  }

  // Subscribe to message type
  const subscribe = (type: string, callback: (data: any) => void): (() => void) => {
    if (!subscribers.value.has(type)) {
      subscribers.value.set(type, new Set())
    }
    
    subscribers.value.get(type)!.add(callback)
    log('Subscribed to', type)

    // Return unsubscribe function
    return () => {
      const typeSubscribers = subscribers.value.get(type)
      if (typeSubscribers) {
        typeSubscribers.delete(callback)
        if (typeSubscribers.size === 0) {
          subscribers.value.delete(type)
        }
      }
      log('Unsubscribed from', type)
    }
  }

  // Unsubscribe from message type
  const unsubscribe = (type: string, callback?: (data: any) => void) => {
    if (callback) {
      const typeSubscribers = subscribers.value.get(type)
      if (typeSubscribers) {
        typeSubscribers.delete(callback)
        if (typeSubscribers.size === 0) {
          subscribers.value.delete(type)
        }
      }
    } else {
      subscribers.value.delete(type)
    }
    log('Unsubscribed from', type)
  }

  // Start heartbeat
  const startHeartbeat = () => {
    if (heartbeatTimer.value) return

    heartbeatTimer.value = setInterval(() => {
      if (isConnected.value) {
        pingTime.value = Date.now()
        send('ping', { timestamp: pingTime.value })
      }
    }, heartbeatInterval)

    log('Started heartbeat')
  }

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = null
      log('Stopped heartbeat')
    }
  }

  // Schedule reconnection
  const scheduleReconnect = () => {
    if (connectionState.value.reconnecting || !canReconnect.value) return

    connectionState.value.reconnecting = true
    connectionState.value.reconnectAttempts++

    const delay = reconnectInterval * Math.pow(2, connectionState.value.reconnectAttempts - 1)
    
    log(`Scheduling reconnect attempt ${connectionState.value.reconnectAttempts} in ${delay}ms`)

    reconnectTimer.value = setTimeout(() => {
      if (connectionState.value.reconnecting) {
        connect().catch(() => {
          if (canReconnect.value) {
            scheduleReconnect()
          } else {
            log('Max reconnect attempts reached')
            connectionState.value.reconnecting = false
            connectionState.value.error = 'Failed to reconnect after maximum attempts'
          }
        })
      }
    }, delay)
  }

  // Generate unique message ID
  const generateMessageId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Reset connection state
  const reset = () => {
    disconnect()
    connectionState.value.reconnectAttempts = 0
    connectionState.value.error = null
    messageQueue.value = []
  }

  // Get connection statistics
  const getStats = () => {
    return {
      connected: isConnected.value,
      reconnectAttempts: connectionState.value.reconnectAttempts,
      queuedMessages: messageQueue.value.length,
      subscribers: Array.from(subscribers.value.keys()),
      latency: connectionState.value.latency,
      lastConnected: connectionState.value.lastConnected
    }
  }

  // Lifecycle
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    connectionState,
    messageQueue,
    
    // Computed
    isConnected,
    isConnecting,
    isReconnecting,
    hasError,
    canReconnect,

    // Methods
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    reset,
    getStats
  }
}

/**
 * Specialized composable for project updates
 */
export function useProjectUpdates(projectId?: Ref<string | null>) {
  const realTime = useRealTime()

  const projectData = ref<any>(null)
  const updates = ref<any[]>([])

  // Subscribe to project-specific updates
  const subscribeToProject = (id: string) => {
    const unsubscribers = [
      realTime.subscribe(`project:${id}:update`, (data) => {
        projectData.value = { ...projectData.value, ...data }
        updates.value.unshift({
          type: 'update',
          data,
          timestamp: Date.now()
        })
      }),

      realTime.subscribe(`project:${id}:status`, (data) => {
        if (projectData.value) {
          projectData.value.status = data.status
        }
        updates.value.unshift({
          type: 'status',
          data,
          timestamp: Date.now()
        })
      }),

      realTime.subscribe(`project:${id}:comment`, (data) => {
        updates.value.unshift({
          type: 'comment',
          data,
          timestamp: Date.now()
        })
      })
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Watch for project ID changes
  if (projectId) {
    watch(projectId, (newId, oldId) => {
      if (oldId) {
        // Unsubscribe from old project
        realTime.unsubscribe(`project:${oldId}:update`)
        realTime.unsubscribe(`project:${oldId}:status`)
        realTime.unsubscribe(`project:${oldId}:comment`)
      }

      if (newId) {
        subscribeToProject(newId)
      }
    }, { immediate: true })
  }

  return {
    ...realTime,
    projectData,
    updates,
    subscribeToProject
  }
}

/**
 * Global real-time instance
 */
export const globalRealTime = useRealTime({
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  debug: process.env.NODE_ENV === 'development'
})

