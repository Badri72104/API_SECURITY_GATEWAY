import { useEffect, useRef, useReducer } from 'react';
import { io } from 'socket.io-client';
import { getGatewayServerUrl } from '../lib/api';

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
    case 'CLEAR_ALERTS':
      return { ...state, alerts: [] };
    default:
      return state;
  }
}

export function useGatewaySocket(serverUrl = getGatewayServerUrl()) {
  const socketRef = useRef(null);
  const [state, dispatch] = useReducer(logsReducer, {
    logs:   [],
    alerts: [],
  });

  useEffect(() => {
    socketRef.current = io(serverUrl, {
      auth: {
        token: localStorage.getItem('gateway-token'),
      },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('[socket] connected');
    });

    socketRef.current.on('request_log', (log) => {
      dispatch({ type: 'APPEND_LOG', payload: log });
    });

    socketRef.current.on('threshold_alert', (alert) => {
      dispatch({ type: 'THRESHOLD_ALERT', payload: alert });
    });

    socketRef.current.on('disconnect', () => {
      console.log('[socket] disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [serverUrl]);

  return { ...state, dispatch };
}
