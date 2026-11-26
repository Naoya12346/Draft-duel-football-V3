import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { C, F } from '../theme';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 1900);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.host}>
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutDown.duration(180)}
            style={[
              styles.toast,
              toast.type === 'success' && { backgroundColor: '#22c55e' },
              toast.type === 'error' && { backgroundColor: '#ef4444' },
              toast.type === 'info' && { backgroundColor: C.gold },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: toast.type === 'error' || toast.type === 'success' ? '#fff' : '#111' },
              ]}
            >
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ? ctx.showToast : () => {};
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    maxWidth: '86%',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  text: {
    fontFamily: F.italic,
    fontSize: 18,
    letterSpacing: 0.4,
  },
});
