/**
 * Performance monitoring utility to identify bottlenecks.
 */
export const PerformanceMonitor = {
  marks: {} as Record<string, number>,
  
  start(markName: string) {
    this.marks[markName] = performance.now();
  },
  
  end(markName: string) {
    const end = performance.now();
    const start = this.marks[markName];
    if (!start) return 0;
    
    const duration = end - start;
    console.log(`[Performance] ${markName} took ${duration.toFixed(2)}ms`);
    
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${markName} - ${duration.toFixed(2)}ms`);
    }
    
    delete this.marks[markName];
    return duration;
  }
};
