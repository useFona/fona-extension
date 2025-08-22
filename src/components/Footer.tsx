import React, { useState } from "react";
import { Heart, Github, Star } from "lucide-react";

// X (Twitter) icon component
const XIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const Footer: React.FC = () => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);

    // Detect browser and redirect to appropriate store
    const userAgent = navigator.userAgent.toLowerCase();
    let storeUrl = "";

    if (userAgent.includes("firefox")) {
      storeUrl = "https://addons.mozilla.org/en-US/firefox/addon/fona/";
    } else if (userAgent.includes("edg")) {
      // Edge uses Chrome Web Store
      storeUrl = "https://chromewebstore.google.com/detail/fona/aiacndhhemhiamcjbmncinfbhnidfdgm";
    } else {
      // Default to Chrome Web Store
      storeUrl = "https://chromewebstore.google.com/detail/fona/aiacndhhemhiamcjbmncinfbhnidfdgm";
    }

    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="my-6">
      <div className="bg-[#242424] border-[#333] border rounded-xl p-4 hover:border-[#292929] transition-all">
        <div className="grid grid-cols-3 gap-2">
          <a
            href="https://buymeacoffee.com/meetjainn"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-b  from-[#242424] to-[#292929] hover:from-[#a5465639] hover:to-[#242424] border hover:border-[#a54656a8] border-[#333] rounded-lg p-3  transition-all group flex flex-col items-center gap-1.5"
          >
            <span className="text-red-500 group-hover:scale-110 transition-transform">
              <Heart size={16} />
            </span>
            <span className="text-xs text-neutral-400 group-hover:text-red-500">
              Support
            </span>
          </a>

          <a
            href="https://x.com/Heyy_meet"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-b from-[#242424] to-[#292929] hover:from-[#4656a539] hover:to-[#242424] border hover:border-[#4656a5a8] border-[#333] rounded-lg p-3  transition-all group flex flex-col items-center gap-1.5"
          >
            <span className="text-indigo-800 group-hover:scale-110 transition-transform">
              <XIcon size={16} />
            </span>
            <span className="text-xs text-neutral-400 group-hover:text-indigo-800">
              X
            </span>
          </a>

          <a
            href="https://github.com/useFona"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-b from-[#242424] to-[#292929] hover:from-[#7746a539] hover:to-[#242424] border hover:border-[#6a46a5b9] border-[#333] rounded-lg p-3  transition-all group flex flex-col items-center gap-1.5"
          >
            <span className="text-violet-700 group-hover:scale-110 transition-transform">
              <Github size={16} />
            </span>
            <span className="text-xs text-neutral-400 group-hover:text-violet-700">
              Github
            </span>
          </a>
        </div>

        <div className="mt-2">
          <div className="bg-[#191919] border border-[#242424] hover:border-[#fbbbbb80] rounded-lg p-3 transition-all group flex flex-col items-center gap-1.5 cursor-pointer">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`transition-all cursor-pointer ${star <= (hoveredStar || selectedRating || 0)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-neutral-600"
                    } hover:scale-110`}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  onClick={() => handleStarClick(star)}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-200 group-hover:text-neutral-400">
              Rate Us
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-200 text-center">
          <span className="text-xs text-neutral-400">
            Fona by {""}
            <a
              href="https://x.com/Heyy_meet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-[#e89292] underline decoration-dotted underline-offset-2"
            >
              meet jain
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
