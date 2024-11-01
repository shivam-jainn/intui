'use client';

import React, { useEffect, useRef } from 'react';

const Landing: React.FC = () => {
  const duckRef = useRef<HTMLDivElement | null>(null); // Type the ref to HTMLDivElement
  const radius = 200; // Radius within which the duck will remain
  const initialTransform = 'translate(-50%, -50%) rotate(30deg)'; // Initial transform for the duck

  // Handle mouse movement to move the duck image
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (duckRef.current) {
        const duck = duckRef.current;
        const duckRect = duck.getBoundingClientRect();
        const duckCenterX = duckRect.left + duckRect.width / 2;
        const duckCenterY = duckRect.top + duckRect.height / 2;

        // Calculate distance from the cursor to the duck's center
        const dx = event.clientX - duckCenterX;
        const dy = event.clientY - duckCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if the cursor is within the defined radius of the duck
        if (distance < radius) {
          // Calculate movement away from the cursor
          const moveX = (dx / distance) * 30; // Move more than 20px for a bouncy effect
          const moveY = (dy / distance) * 30;
          duck.style.transform = `translate(-50%, -50%) translate(${-moveX}px, ${-moveY}px) rotate(30deg)`;
        } else {
          // Reset the duck's position when the cursor is far enough
          duck.style.transform = initialTransform; // Return to original position
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section
      style={{
        background: 'black',
        position: 'relative',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: '8vw', // Responsive font size for mobile
          fontWeight: 'bold', // Make the text bold
          textAlign: 'center',
          marginBottom: '30vh', // Space below for the duck
          position: 'relative',
          zIndex: 2, // Ensure it is above the duck
        }}
      >
        Intui
      </div>
      <div
        ref={duckRef}
        style={{
          backgroundImage: 'url(/prismduck.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'absolute', // Use absolute positioning for overlap
          top: '50%', // Center vertically
          left: '50%', // Center horizontally
          transform: initialTransform, // Initial positioning and rotation
          width: '25vw', // Responsive width
          height: '25vw', // Responsive height
          minWidth: '200px', // Minimum width for larger screens
          minHeight: '200px', // Minimum height for larger screens
          pointerEvents: 'none', // Prevent mouse events on the duck image
          transition: 'transform 0.2s ease', // Smooth transition for movement
          zIndex: 1, // Set below the text
        }}
      />
      <div
        style={{
          color: 'white',
          fontSize: '4vw', // Increased responsive font size for mobile
          fontWeight: 'bold', // Make the text bold
          textAlign: 'center',
          position: 'relative',
          zIndex: 2, // Ensure it is above the duck
        }}
      >
        Your rubber duck for interview prep
      </div>
    </section>
  );
};

export default Landing;
