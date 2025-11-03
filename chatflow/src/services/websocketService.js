import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { getStoredAuthToken } from '@/stores/auth'

const WS_BASE_PATH = import.meta.env.VITE_WS_BASE_PATH ?? '/ws'

/**
 * WebSocket 服务
 * 基于 STOMP over SockJS 实现实时通信
 */
class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 3000
    this.subscriptions = new Map()
    this.messageHandlers = new Map()
    this.onConnectCallbacks = []
    this.onDisconnectCallbacks = []
    this.onErrorCallbacks = []
  }

  /**
   * 连接 WebSocket
   * @param {Object} options - 连接选项
   * @param {Function} options.onConnect - 连接成功回调
   * @param {Function} options.onDisconnect - 断开连接回调
   * @param {Function} options.onError - 错误回调
   */
  connect({ onConnect, onDisconnect, onError } = {}) {
    if (this.connected && this.client?.active) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = WS_BASE_PATH
        
        // 获取认证 token
        const token = getStoredAuthToken()
        if (!token) {
          throw new Error('认证token缺失，请先登录')
        }
        
        // 准备STOMP连接头
        const connectHeaders = {
          'Authorization': `Bearer ${token}`
        }
        
        this.client = new Client({
          webSocketFactory: () => {
            // SockJS不支持自定义HTTP Header，必须通过URL参数传递token
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

            // 不要自动重连，除非是意外断开
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

  /**
   * 处理重连
   */
  handleReconnect(options) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      if (!this.connected) {
        this.connect(options).catch(() => {
          // 重连失败，等待下一次重试
        })
      }
    }, delay)
  }

  /**
   * 处理错误
   */
  handleError(error) {
    // 错误已由回调处理
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.client) {
      this.clearSubscriptions()
      this.client.deactivate()
      this.client = null
      this.connected = false
      this.reconnectAttempts = 0
    }
  }

  /**
   * 订阅消息
   * @param {string} destination - 目标路径
   * @param {Function} callback - 消息回调函数
   * @returns {Function} 取消订阅函数
   */
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

  /**
   * 取消订阅
   */
  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(destination)
      this.messageHandlers.delete(destination)
    }
  }

  /**
   * 清除所有订阅
   */
  clearSubscriptions() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    this.messageHandlers.clear()
  }

  /**
   * 发送消息
   * @param {string} destination - 目标路径（如 '/app/chat'）
   * @param {Object} body - 消息体
   * @param {Object} headers - 可选的消息头
   */
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

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.connected && this.client?.active
  }
}

// 导出单例
export const websocketService = new WebSocketService()
export default websocketService

