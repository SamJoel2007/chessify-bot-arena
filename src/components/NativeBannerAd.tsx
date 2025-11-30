import { useEffect, useRef } from "react";

export const NativeBannerAd = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !containerRef.current) return;
    
    // Set ad options globally
    (window as any).atOptions = {
      'key': '573b1fcdddbf208751c3334f41fd5509',
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };
    
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//www.highperformanceformat.com/573b1fcdddbf208751c3334f41fd5509/invoke.js";
    
    containerRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="mt-12 flex justify-center">
      <div ref={containerRef} />
    </div>
  );
};
