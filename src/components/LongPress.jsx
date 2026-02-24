import { useRef, useCallback } from "react";

const LongPress = (callback, ms = 600) => {
  const timerRef = useRef();

  const start = useCallback(
    (event) => {
      event.persist?.();
      timerRef.current = setTimeout(() => {
        callback(event);
      }, ms);
    },
    [callback, ms]
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear, // cancel if user scrolls
    onMouseDown: start, // optional: also works with mouse long press
    onMouseUp: clear,
    onMouseLeave: clear,
  };
};

export default LongPress;
