import { useEffect, useRef } from "react";

export const NativeBannerAd = () => {
  const container1Ref = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const scriptsLoaded = useRef(false);

  useEffect(() => {
    if (scriptsLoaded.current || !container1Ref.current || !container2Ref.current) return;
    
    // First ad - banner ad with atOptions
    (window as any).atOptions = {
      'key': '573b1fcdddbf208751c3334f41fd5509',
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };
    
    const script1 = document.createElement("script");
    script1.type = "text/javascript";
    script1.src = "//www.highperformanceformat.com/573b1fcdddbf208751c3334f41fd5509/invoke.js";
    
    container1Ref.current.appendChild(script1);
    
    // Second ad - native ad
    const script2 = document.createElement("script");
    script2.async = true;
    script2.setAttribute("data-cfasync", "false");
    script2.src = "//pl28024731.effectivegatecpm.com/c0a3bb06ff6c9c340ac35aeec05bc748/invoke.js";
    
    container2Ref.current.appendChild(script2);
    scriptsLoaded.current = true;

    return () => {
      if (container1Ref.current && script1.parentNode === container1Ref.current) {
        container1Ref.current.removeChild(script1);
      }
      if (container2Ref.current && script2.parentNode === container2Ref.current) {
        container2Ref.current.removeChild(script2);
      }
    };
  }, []);

  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      <div ref={container1Ref} />
      <div ref={container2Ref}>
        <div id="container-c0a3bb06ff6c9c340ac35aeec05bc748"></div>
      </div>
    </div>
  );
};
