import { useState } from 'react';

export function useLocalStorage(key: string, initialValue: string) {
  const [storageValue, setStorageValue] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const currentValue = window.localStorage.getItem(key);

      if (currentValue == null) {
        window.localStorage.setItem(key, initialValue);
        return initialValue;
      }

      return currentValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: string): void => {
    try {
      setStorageValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storageValue, setValue] as const;
}
