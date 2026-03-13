export function GlobalStyles() {
  return (
    <style>{`
      /* Global background image on all screens */
      body, #root {
        background-image: url('/background.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        min-height: 100%;
      }

      :root { 
        --pastel-green-start: #a7f3d0; 
        --pastel-green-end: #6ee7b7;
        --primary-color: #6366f1;
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
      }
      
      /* Mobile-optimized touch targets */
      button:not(.filter-chip):not(.chat-send-button):not(.calendar-date-button), a, .clickable {
        min-height: 44px;
        min-width: 44px;
        cursor: pointer;
      }
      
      /* Smooth scrolling for iOS */
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      .cat-table-head, .cat-table-row { 
        grid-template-columns: 1fr 70px 80px !important; 
      }

      /* Shared page container */
      .page { 
        max-width: 1100px; 
        margin: 0 auto; 
        padding: 18px;
        padding-bottom: calc(18px + var(--safe-area-inset-bottom));
      }

      /* Mobile-first optimizations */
      @media (max-width: 768px) {
        h1 { font-size: 28px !important; line-height: 1.3; }
        h2 { font-size: 18px !important; line-height: 1.4; }
        p, textarea, button:not(.filter-chip) { font-size: 16px !important; } /* Prevent iOS zoom */
        input, select { font-size: 16px !important; } /* Prevent iOS zoom */
        .container-pad { padding: 16px !important; }
        .card-pad { padding: 16px !important; }
        .chat-height { height: calc(100vh - 220px) !important; }
        
        /* Better touch spacing */
        button:not(.filter-chip):not(.chat-send-button):not(.calendar-date-button), .btn {
          padding: 12px 20px !important;
          margin: 8px 0 !important;
        }
      }
      
      @media (max-width: 480px) {
        .cat-table-head, .cat-table-row { 
          grid-template-columns: 1fr 64px 74px !important; 
        }
        h1 { font-size: 24px !important; }
        h2 { font-size: 16px !important; }
        .wide-btn { width: 100% !important; }
        
        /* Full-width mobile elements */
        .page { padding: 12px; padding-bottom: calc(12px + var(--safe-area-inset-bottom)); }
      }
      
      /* Landscape mobile optimization */
      @media (max-height: 600px) and (orientation: landscape) {
        .page { padding: 8px; }
        button:not(.filter-chip):not(.chat-send-button):not(.calendar-date-button), .btn { padding: 8px 16px !important; }
      }
      
      /* Remove tap highlight on mobile */
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Better focus states for accessibility */
      *:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
    `}</style>
  );
}

