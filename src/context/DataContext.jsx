import { createContext, useContext, useState, useCallback } from 'react';
import { getStore } from '../services/localStorageService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const getData = useCallback(() => {
    void version;
    return getStore();
  }, [version]);

  return (
    <DataContext.Provider value={{ getData, refresh, version }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
