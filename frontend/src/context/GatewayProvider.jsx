import { createContext, useContext, useEffect, useRef, useReducer, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getGatewayServerUrl } from '../lib/api';
import { useAuth } from './AuthContext';

const GatewayContext = createContext();

const MAX_LOGS = 500;

function logsReducer(state, action) {
  switch (action.type) {
    case 'APPEND_LOG':
      return {
        ...state,
        logs: [action.payload, ...state.logs].slice(0, MAX_LOGS),
      };
    case 'THRESHOLD_ALERT':
      return {
        ...state,
        alerts: [...state.alerts, action.payload],
      };
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    case 'SET_LOGS':
      return { ...state, logs: action.payload.slice(0, MAX_LOGS) };
    case 'CLEAR_ALERTS':
      return { ...state, alerts: [] };
    default:
      return state;
  }
}

export function GatewayProvider({ children, serverUrl = getGatewayServerUrl() }) {
  const socketRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(logsReducer, {
    logs: [],
    alerts: [],
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gateway-token');
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    api.get('/api/logs?limit=500')
      .then(({ data }) => {
        dispatch({ type: 'SET_LOGS', payload: data });
      })
      .catch((err) => {
        console.error('[logs] failed to load:', err.response?.data?.error || err.message);
      });

    socketRef.current = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('[socket] connected');
      setIsConnected(true);
    });

    socketRef.current.on('request_log', (log) => {
      dispatch({ type: 'APPEND_LOG', payload: log });
    });

    socketRef.current.on('threshold_alert', (alert) => {
      dispatch({ type: 'THRESHOLD_ALERT', payload: alert });
    });

    socketRef.current.on('disconnect', () => {
      console.log('[socket] disconnected');
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, serverUrl]);

  const value = { ...state, dispatch, isConnected };

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useGateway = () => {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error('useGateway must be used within GatewayProvider');
  }
  return context;
};
