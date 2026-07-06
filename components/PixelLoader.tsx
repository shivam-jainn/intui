import React from 'react';

const PixelLoader = ({ text = "LOADING", className = "" }: { text?: string, className?: string }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="flex gap-2">
        <div className="pixel-dot" style={{ animationDelay: '0ms' }}></div>
        <div className="pixel-dot" style={{ animationDelay: '300ms' }}></div>
        <div className="pixel-dot" style={{ animationDelay: '600ms' }}></div>
      </div>
      <div className="pixel-font text-xs tracking-widest text-[#E61E1E]">
        {text}
      </div>
    </div>
  );
}

export default PixelLoader;
