import { useRef, useCallback, useEffect } from 'react';

/**
 * useSwipeGesture - Detects swipe gestures on touch devices.
 * 
 * @param {Object} options
 * @param {'right'|'left'|'down'|'up'} options.direction - The swipe direction to detect.
 * @param {Function} options.onSwipe - Callback fired when a valid swipe is detected.
 * @param {number} [options.threshold=80] - Minimum distance (px) for the swipe to register.
 * @param {boolean} [options.enabled=true] - Whether the gesture detection is active.
 * @returns {{ ref: React.RefObject }} - Attach `ref` to the swipeable container element.
 */
export default function useSwipeGesture({ direction = 'right', onSwipe, threshold = 80, enabled = true }) {
    const ref = useRef(null);
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    const isHorizontal = direction === 'left' || direction === 'right';

    const handleTouchStart = useCallback((e) => {
        if (!enabled) return;
        touchEnd.current = null;
        touchStart.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
    }, [enabled]);

    const handleTouchMove = useCallback((e) => {
        if (!enabled) return;
        touchEnd.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
    }, [enabled]);

    const handleTouchEnd = useCallback(() => {
        if (!enabled || !touchStart.current || !touchEnd.current) return;

        const deltaX = touchEnd.current.x - touchStart.current.x;
        const deltaY = touchEnd.current.y - touchStart.current.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Ensure the dominant axis matches the expected direction
        if (isHorizontal && absDeltaY > absDeltaX) return; // vertical scroll, ignore
        if (!isHorizontal && absDeltaX > absDeltaY) return; // horizontal scroll, ignore

        let swiped = false;

        switch (direction) {
            case 'horizontal':
                swiped = Math.abs(deltaX) > threshold;
                break;
            case 'right':
                swiped = deltaX > threshold;
                break;
            case 'left':
                swiped = deltaX < -threshold;
                break;
            case 'down':
                swiped = deltaY > threshold;
                break;
            case 'up':
                swiped = deltaY < -threshold;
                break;
        }

        if (swiped && onSwipe) {
            onSwipe();
        }

        touchStart.current = null;
        touchEnd.current = null;
    }, [enabled, direction, threshold, onSwipe, isHorizontal]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { ref };
}
