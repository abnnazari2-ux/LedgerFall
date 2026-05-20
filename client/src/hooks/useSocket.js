import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export function useSocket(options = {}) {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const listenersRef = useRef([])

  useEffect(() => {
    const token = localStorage.getItem('ledgerfall_token')

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      ...options,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    })

    socket.on('connect_error', (err) => {
      setConnectionError(err.message)
      setIsConnected(false)
    })

    // Re-attach any pending listeners
    listenersRef.current.forEach(({ event, callback }) => {
      socket.on(event, callback)
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = useCallback((event, data, ack) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, ack)
    } else {
      console.warn('[Socket] Attempted to emit while disconnected:', event)
    }
  }, [])

  const on = useCallback((event, callback) => {
    listenersRef.current.push({ event, callback })
    socketRef.current?.on(event, callback)
    return () => {
      socketRef.current?.off(event, callback)
      listenersRef.current = listenersRef.current.filter(
        (l) => !(l.event === event && l.callback === callback)
      )
    }
  }, [])

  const off = useCallback((event, callback) => {
    socketRef.current?.off(event, callback)
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
  }
}

export default useSocket
