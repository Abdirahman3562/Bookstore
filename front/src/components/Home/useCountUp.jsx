import { useEffect, useState, useRef } from "react";

// 🎨 Smooth ease-out function
function easeOutQuad(t) {
  return t * (2 - t);
}

export function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;

    // Always start from ZERO for smooth animation
    setCount(0);
    startRef.current = null;

    const startValue = 0;
    const endValue = Number(target);

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;

      const progress = Math.min((timestamp - startRef.current) / duration, 1);

      // Apply easing
      const easedProgress = easeOutQuad(progress);

      const currentValue = Math.floor(startValue + easedProgress * (endValue - startValue));

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target]);

  return count;
}
