import { RefObject, useEffect, useRef } from "react";

export default function useClickOutside(fn: () => any): RefObject<any> {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current) return;
      if (ref.current && !ref.current.contains(event.target as Node)) {
        fn();
      }
    }

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
    };
  }, [ref]);

  return ref;
}
