import { useEffect, useState } from "react";

export function AnalyzingOverlay() {
  const quotes = [
    { q: "Know thyself.", a: "— Socrates" },
    {
      q: "He who has a why to live can bear almost any how.",
      a: "— Nietzsche",
    },
    {
      q: "The soul becomes dyed with the color of its thoughts.",
      a: "— Marcus Aurelius",
    },
    {
      q: "We are what we repeatedly do. Excellence, then, is a habit.",
      a: "— Aristotle",
    },
    { q: "The unexamined life is not worth living.", a: "— Socrates" },
    {
      q: "Act in alignment with your values, not just your moods.",
      a: "— ACT principle",
    },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((s) => (s + 1) % quotes.length), 1600);
    return () => clearInterval(t);
  }, [quotes.length]);
  const phrase = [
    "Analyzing answers…",
    "Adding details…",
    "Determining results…",
  ];
  const [pI, setPI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPI((s) => (s + 1) % phrase.length), 900);
    return () => clearInterval(t);
  }, [phrase.length]);
  
  // Force viewport reset by manipulating the meta tag and forcing reflow
  useEffect(() => {
    // Get current viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content') || '';
    
    // Force immediate zoom reset
    if (viewport) {
      // Remove and re-add the viewport tag to force iOS to recalculate
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no';
      
      viewport.remove();
      document.head.appendChild(newViewport);
      
      // Force scroll reset
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Lock scrolling
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      
      // Force a reflow by accessing layout properties
      document.body.offsetHeight;
      
      return () => {
        // Restore original viewport
        newViewport.remove();
        if (originalContent) {
          const restoredViewport = document.createElement('meta');
          restoredViewport.name = 'viewport';
          restoredViewport.content = originalContent;
          document.head.appendChild(restoredViewport);
        }
        
        document.body.style.overflow = "unset";
        document.documentElement.style.overflow = "unset";
      };
    }
    
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        // Simple approach - just center it
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          padding: "36px 32px",
          borderRadius: 24,
          border: "1px solid rgba(106, 58, 191, 0.2)",
          boxShadow: "0 20px 60px rgba(106, 58, 191, 0.25)",
          backdropFilter: "blur(20px)",
          textAlign: "center",
          maxWidth: "360px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, animation: "pulse 2s ease-in-out infinite" }}>✨</div>
        <div id="analysis-title" style={{ fontWeight: 700, marginBottom: 12, fontSize: 20, color: "#6A3ABF" }}>
          {phrase[pI]}
        </div>
        <div style={{ color: "#6b6b6b", marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
          We use evidence-based frameworks to interpret your answers.
        </div>

        <div
          style={{
            padding: "20px 24px",
            borderRadius: 16,
            border: "2px solid rgba(106, 58, 191, 0.15)",
            background: "rgba(106, 58, 191, 0.05)",
            color: "#2D2A26",
            minHeight: 100,
            transition: "all 400ms ease",
          }}
        >
          <div
            style={{
              fontStyle: "italic",
              fontSize: 16,
              lineHeight: 1.7,
              marginBottom: 8,
              color: "#4A3A6A",
            }}
          >
            "{quotes[i].q}"
          </div>
          <div style={{ fontSize: 13, color: "#8A4EF0", fontWeight: 600 }}>{quotes[i].a}</div>
        </div>

        {/* Add animated loading dots */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 8 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: "50%", 
            background: "#6A3ABF",
            animation: "bounce 1.4s infinite ease-in-out both",
            animationDelay: "-0.32s"
          }} />
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: "50%", 
            background: "#8A4EF0",
            animation: "bounce 1.4s infinite ease-in-out both",
            animationDelay: "-0.16s"
          }} />
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: "50%", 
            background: "#B088F0",
            animation: "bounce 1.4s infinite ease-in-out both"
          }} />
        </div>

        {/* Add CSS animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 40% { 
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

