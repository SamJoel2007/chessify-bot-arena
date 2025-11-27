import { useEffect, useRef } from "react";

export const NativeBannerAd = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !containerRef.current) return;
    
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "//pl28024731.effectivegatecpm.com/c0a3bb06ff6c9c340ac35aeec05bc748/invoke.js";
    
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
      <div ref={containerRef}>
        <div id="container-c0a3bb06ff6c9c340ac35aeec05bc748"></div>
      </div>
    </div>
  );
};
