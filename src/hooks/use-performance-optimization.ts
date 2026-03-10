'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
}

export const usePerformanceOptimization = () => {
  const renderStartTime = useRef<number>(Date.now());
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0
  });

  // Debounced function to prevent excessive re-renders
  const debouncedCallback = useCallback(
    (callback: Function, delay: number = 300) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      };
    },
    []
  );

  // Memoized heavy computation
  const memoizedHeavyComputation = useCallback(
    (data: any[], computeFunction: Function) => {
      const startTime = performance.now();
      const result = computeFunction(data);
      const endTime = performance.now();
      
      metricsRef.current.renderTime = endTime - startTime;
      
      if (metricsRef.current.renderTime > 16) { // More than 60fps
        console.warn(`Slow render detected: ${metricsRef.current.renderTime.toFixed(2)}ms`);
      }
      
      return result;
    },
    []
  );

  // Memory monitoring
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      
      if (metricsRef.current.memoryUsage > 0.8) {
        console.warn(`High memory usage: ${(metricsRef.current.memoryUsage * 100).toFixed(1)}%`);
      }
    }
  }, []);

  useEffect(() => {
    const endTime = Date.now();
    metricsRef.current.renderTime = endTime - renderStartTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Component render time:', metricsRef.current.renderTime, 'ms');
    }
    
    renderStartTime.current = Date.now();
    checkMemoryUsage();
  });

  return {
    metrics: metricsRef.current,
    debouncedCallback,
    memoizedHeavyComputation,
    checkMemoryUsage
  };
};

// Virtual scrolling hook for large datasets
export const useVirtualScroll = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, scrollTop, itemHeight, containerHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop
  };
};
