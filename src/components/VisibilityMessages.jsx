import { useEffect, useRef } from "react";

export default function VisibilityMessages(messageRefs, onVisibleMessages) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!messageRefs || !Object.values(messageRefs.current).length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleMessageIds = entries
                    .filter(entry => entry.isIntersecting)
                    .map(entry => entry.target.dataset.id);

                if (visibleMessageIds.length) {
                    // Debounce API calls
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        onVisibleMessages(visibleMessageIds);
                    }, 500); // Adjust debounce timing as needed
                }
            },
            { threshold: 1.0 }
        );

        Object.values(messageRefs.current).forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => {
            Object.values(messageRefs.current).forEach(ref => {
                if (ref.current) observer.unobserve(ref.current);
            });
            clearTimeout(timeoutRef.current);
        };
    }, [messageRefs, onVisibleMessages]);
}
