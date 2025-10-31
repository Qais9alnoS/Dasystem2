import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Virtual scrolling hook for large lists
export const useVirtualScroll = <T>(
    items: T[],
    containerHeight: number,
    itemHeight: number
) => {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleItems = useMemo(() => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / itemHeight) + 1,
            items.length
        );

        return {
            startIndex,
            endIndex,
            visibleItems: items.slice(startIndex, endIndex),
            totalHeight: items.length * itemHeight,
            offsetY: startIndex * itemHeight,
        };
    }, [items, scrollTop, containerHeight, itemHeight]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return {
        ...visibleItems,
        handleScroll,
    };
};

// Debounced search hook
export const useDebouncedSearch = (
    searchTerm: string,
    delay: number = 300
) => {
    const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, delay]);

    return debouncedTerm;
};

// Performance monitoring hook
export const usePerformanceMonitor = (name: string) => {
    const startTime = useRef<number>(Date.now());
    const [metrics, setMetrics] = useState<{
        renderTime: number;
        memoryUsage?: number;
    }>({ renderTime: 0 });

    useEffect(() => {
        const endTime = Date.now();
        const renderTime = endTime - startTime.current;

        setMetrics({
            renderTime,
            memoryUsage: (performance as any).memory?.usedJSHeapSize,
        });

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Component ${name} render time: ${renderTime}ms`);
        }
    });

    return metrics;
};

// Optimized data fetching with caching
export const useOptimizedFetch = <T>(
    key: string,
    fetchFn: () => Promise<T>,
    dependencies: any[] = []
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchData = useCallback(async () => {
        const cached = cacheRef.current.get(key);
        const now = Date.now();

        // Return cached data if still valid
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            setData(cached.data);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await fetchFn();
            setData(result);

            // Cache the result
            cacheRef.current.set(key, { data: result, timestamp: now });
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [key, fetchFn]);

    useEffect(() => {
        fetchData();
    }, [fetchData, ...dependencies]);

    const invalidateCache = useCallback(() => {
        cacheRef.current.delete(key);
    }, [key]);

    return { data, loading, error, refetch: fetchData, invalidateCache };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
    options: IntersectionObserverInit = {}
) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [target, setTarget] = useState<Element | null>(null);

    useEffect(() => {
        if (!target) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [target, options]);

    return [setTarget, isIntersecting] as const;
};

// Memory usage monitor
export const useMemoryMonitor = () => {
    const [memoryInfo, setMemoryInfo] = useState<{
        used: number;
        total: number;
        percentage: number;
    }>({ used: 0, total: 0, percentage: 0 });

    useEffect(() => {
        const updateMemoryInfo = () => {
            if ('memory' in performance) {
                const memory = (performance as any).memory;
                const used = memory.usedJSHeapSize;
                const total = memory.totalJSHeapSize;

                setMemoryInfo({
                    used,
                    total,
                    percentage: (used / total) * 100,
                });
            }
        };

        updateMemoryInfo();
        const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return memoryInfo;
};

// Optimized list filtering
export const useOptimizedFilter = <T>(
    items: T[],
    searchTerm: string,
    filterFn: (item: T, term: string) => boolean,
    sortFn?: (a: T, b: T) => number
) => {
    const debouncedTerm = useDebouncedSearch(searchTerm, 300);

    const filteredItems = useMemo(() => {
        let result = items;

        if (debouncedTerm) {
            result = items.filter(item => filterFn(item, debouncedTerm));
        }

        if (sortFn) {
            result = [...result].sort(sortFn);
        }

        return result;
    }, [items, debouncedTerm, filterFn, sortFn]);

    return filteredItems;
};