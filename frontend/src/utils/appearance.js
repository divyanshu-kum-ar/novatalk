export const applyAppearance = (theme, wallpaper, fontSize, accentColor) => {
  const currentTheme = theme || "dark";
  const currentWallpaper = wallpaper || "default";
  const currentFontSize = fontSize || "medium";
  const currentAccent = accentColor || "blue";

  const accents = {
    blue: { primary: "#3b82f6", hover: "#2563eb", text: "#60a5fa" },
    green: { primary: "#10b981", hover: "#059669", text: "#34d399" },
    purple: { primary: "#8b5cf6", hover: "#7c3aed", text: "#a78bfa" },
    orange: { primary: "#f97316", hover: "#ea580c", text: "#fb923c" },
    red: { primary: "#ef4444", hover: "#dc2626", text: "#f87171" },
    pink: { primary: "#ec4899", hover: "#db2777", text: "#f472b6" },
    cyan: { primary: "#06b6d4", hover: "#0891b2", text: "#22d3ee" }
  };
  const activeAccent = accents[currentAccent] || accents.blue;

  const fontSizes = {
    small: "12px",
    medium: "14px",
    large: "18px"
  };
  const activeFontSize = fontSizes[currentFontSize] || fontSizes.medium;

  let cssText = `
    :root {
      --accent-color: ${activeAccent.primary};
      --accent-hover: ${activeAccent.hover};
      --accent-text: ${activeAccent.text};
      --font-size-base: ${activeFontSize};
    }

    /* Accent color overrides */
    .bg-sky-500, .bg-blue-600, .btn-primary, .bg-sky-600 {
      background-color: var(--accent-color) !important;
    }
    .hover\\:bg-sky-600:hover, .hover\\:bg-blue-500:hover, .hover\\:bg-sky-500:hover {
      background-color: var(--accent-hover) !important;
    }
    .text-sky-500, .text-sky-400, .text-blue-500, .text-sky-300 {
      color: var(--accent-text) !important;
    }
    .hover\\:text-sky-500:hover {
      color: var(--accent-text) !important;
    }
    .ring-sky-500, .ring-primary {
      --tw-ring-color: var(--accent-color) !important;
      border-color: var(--accent-color) !important;
    }
    .toggle:checked, .toggle-primary:checked, .toggle-info:checked {
      background-color: var(--accent-color) !important;
      border-color: var(--accent-color) !important;
      --tglbg: #ffffff !important;
    }
    
    /* Font size overrides */
    .chat-bubble, 
    .chat-bubble *, 
    textarea, 
    input, 
    .label-text, 
    .conversations-container p, 
    .conversations-container span, 
    .settings-container p, 
    .settings-container span, 
    .settings-container select, 
    .settings-container button {
      font-size: var(--font-size-base) !important;
    }

    /* Chat Wallpaper Styles */
    .px-4.flex-1.overflow-auto {
  `;

  if (currentWallpaper === "blue") {
    cssText += `
      background-color: #1e3a8a !important;
      background-image: radial-gradient(circle at top, #3b82f6, #1e3a8a) !important;
    `;
  } else if (currentWallpaper === "dark") {
    cssText += `
      background-color: #0b0f19 !important;
      background-image: none !important;
    `;
  } else if (currentWallpaper === "gradient") {
    cssText += `
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    `;
  } else if (currentWallpaper === "snow") {
    cssText += `
      background-color: #f1f5f9 !important;
      background-image: radial-gradient(circle at center, #ffffff 0%, #cbd5e1 100%) !important;
      color: #0f172a !important;
    `;
  } else if (currentWallpaper === "mountains") {
    cssText += `
      background: linear-gradient(to bottom, #0f172a, #1e293b) !important;
    `;
  } else if (currentWallpaper === "forest") {
    cssText += `
      background: linear-gradient(135deg, #064e3b 0%, #047857 100%) !important;
    `;
  } else if (currentWallpaper === "minimal") {
    cssText += `
      background-color: #121212 !important;
      background-image: radial-gradient(#262626 1px, transparent 1px) !important;
      background-size: 20px 20px !important;
    `;
  } else if (currentWallpaper === "abstract") {
    cssText += `
      background: linear-gradient(45deg, #ea580c, #db2777, #0284c7, #0d9488) !important;
      background-size: 400% 400% !important;
      animation: gradientBG 15s ease infinite !important;
    `;
  } else if (currentWallpaper === "solid") {
    cssText += `
      background-color: #334155 !important;
      background-image: none !important;
    `;
  } else {
    cssText += `
      background: transparent !important;
    `;
  }

  cssText += `
    }
  `;

  const html = document.documentElement;
  if (currentTheme === "light") {
    html.classList.add("light-theme");
    html.setAttribute("data-theme", "light");
    cssText += `
      html.light-theme body {
        background: linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url("/bg.png") !important;
        background-size: cover !important;
        color: #1f2937 !important;
      }
      html.light-theme .bg-gray-400 {
        background-color: rgba(255, 255, 255, 0.45) !important;
        border-color: #d1d5db !important;
        color: #1f2937 !important;
      }
      html.light-theme .bg-slate-900,
      html.light-theme .bg-slate-800,
      html.light-theme .bg-gray-800 {
        background-color: #f3f4f6 !important;
        color: #1f2937 !important;
      }
      html.light-theme .text-white,
      html.light-theme .text-gray-300,
      html.light-theme .text-gray-200 {
        color: #1f2937 !important;
      }
      html.light-theme .text-gray-400 {
        color: #6b7280 !important;
      }
      html.light-theme .border-r,
      html.light-theme .border-slate-500,
      html.light-theme .border-slate-700 {
        border-color: #d1d5db !important;
      }
      html.light-theme .input,
      html.light-theme select,
      html.light-theme textarea {
        background-color: #ffffff !important;
        color: #1f2937 !important;
        border-color: #d1d5db !important;
      }
      html.light-theme .divider::before, 
      html.light-theme .divider::after {
        background-color: #e5e7eb !important;
      }
    `;
  } else {
    html.classList.remove("light-theme");
    html.setAttribute("data-theme", "dark");
  }

  let styleTag = document.getElementById("novatalk-appearance-injected");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "novatalk-appearance-injected";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = cssText;
};
