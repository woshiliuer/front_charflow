import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { getStoredAuthToken } from '@/stores/auth'

const WS_BASE_PATH = import.meta.env.VITE_WS_BASE_PATH ?? '/ws'

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 60000
    this.subscriptions = new Map()
    this.messageHandlers = new Map()
    this.onConnectCallbacks = []
    this.onDisconnectCallbacks = []
    this.onErrorCallbacks = []
  }

  connect({ onConnect, onDisconnect, onError } = {}) {
    if (this.connected && this.client?.active) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = WS_BASE_PATH
        const token = getStoredAuthToken()
        if (!token) {
          throw new Error('认证token缺失，请先登录')
        }

        const connectHeaders = {
          'Authorization': `Bearer ${token}`
        }

        this.client = new Client({
          webSocketFactory: () => {
            const wsUrlWithToken = `${wsUrl}?token=${token}`
            return new SockJS(wsUrlWithToken)
          },
          connectHeaders,
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: () => {},
          logRawCommunication: false,
          onConnect: (frame) => {
            this.connected = true
            this.reconnectAttempts = 0
            console.log('[WebSocket] 连接成功', frame)
            if (onConnect) {
              onConnect(frame)
            }
            this.onConnectCallbacks.forEach((cb) => cb(frame))
            resolve(frame)
          },
          onStompError: (frame) => {
            this.handleError(frame)
            if (onError) {
              onError(frame)
            }
            this.onErrorCallbacks.forEach((cb) => cb(frame))
            reject(frame)
          },
          onWebSocketClose: (event) => {
            this.connected = false
            this.clearSubscriptions()
            if (onDisconnect) {
              onDisconnect(event)
            }
            this.onDisconnectCallbacks.forEach((cb) => cb(event))
            if (event.code !== 1000) {
              this.handleReconnect({ onConnect, onDisconnect, onError })
            }
          },
          onDisconnect: () => {
            this.connected = false
            this.clearSubscriptions()
          },
        })

        this.client.activate()
      } catch (error) {
        this.connected = false
        this.reconnectAttempts = 0
        reject(error)
      }
    })
  }

  handleReconnect(options) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    setTimeout(() => {
      if (!this.connected) {
        this.connect(options).catch(() => {})
      }
    }, delay)
  }

  handleError(error) {}

  disconnect() {
    if (this.client) {
      this.clearSubscriptions()
      this.client.deactivate()
      this.client = null
      this.connected = false
      this.reconnectAttempts = 0
    }
  }

  subscribe(destination, callback) {
    if (!this.connected || !this.client?.active) {
      return () => {}
    }
    if (this.subscriptions.has(destination)) {
      this.unsubscribe(destination)
    }
    try {
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body)
          console.log(`[WebSocket] 收到订阅消息 [${destination}]:`, body)
          callback(body, message)
          if (this.messageHandlers.has(destination)) {
            this.messageHandlers.get(destination).forEach((handler) => {
              handler(body, message)
            })
          }
        } catch (error) {
          console.error(`[WebSocket] 解析消息失败 [${destination}]:`, error)
          callback(message.body, message)
        }
      })
      this.subscriptions.set(destination, subscription)
      console.log(`[WebSocket] 已订阅: ${destination}`)
      return () => this.unsubscribe(destination)
    } catch (error) {
      console.error(`[WebSocket] 订阅失败 [${destination}]:`, error)
      return () => {}
    }
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(destination)
      this.messageHandlers.delete(destination)
    }
  }

  clearSubscriptions() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    this.messageHandlers.clear()
  }

  send(destination, body, headers = {}) {
    if (!this.connected || !this.client?.active) {
      return false
    }
    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
        headers,
      })
      return true
    } catch (error) {
      return false
    }
  }

  isConnected() {
    return this.connected && this.client?.active
  }
}

export const websocketService = new WebSocketService()
export default websocketService
