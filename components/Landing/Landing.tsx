'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Text } from '@mantine/core';

const Landing: React.FC = () => {
  const duckRef = useRef<HTMLDivElement | null>(null);
  const [, setShowButton] = useState(true); // Removed `_`, as it's not used.
  const radius = 200; // Radius within which the duck will remain
  const initialTransform = 'translate(-50%, -50%) rotate(30deg)'; // Initial transform for the duck

  // Scroll to section
  const scrollToSection = () => {
    const section = document.getElementById('whyus');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowButton(false); // Hide the button after scrolling down
      } else {
        setShowButton(true); // Show the button when at the top
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <section
        style={{
          background: 'black',
          overflow: 'hidden',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: '60vh', position: 'relative' }}>
          <div
            style={{
              color: 'white',
              fontSize: '8vw', // Responsive font size for mobile
              fontWeight: 'bold', // Make the text bold
              textAlign: 'center',
              paddingTop: '3rem',
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
              top: '70%', // Center vertically
              left: '50%', // Center horizontally
              transform: initialTransform, // Initial positioning and rotation
              width: '15vw', // Responsive width
              height: '15vw', // Responsive height
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
              fontSize: '6vw', // Increased responsive font size for mobile
              fontWeight: 'bold', // Make the text bold
              textAlign: 'center',
              zIndex: 2, // Ensure it is above the duck
            }}
          >
            Your rubber duck for interview prep
          </div>
        </div>

        <div
          style={{
            height: '40vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={scrollToSection}
            style={{
              minWidth: '120px',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '3rem',
              cursor: 'pointer',
              color: 'black',
              fontWeight: 'bolder',
              padding: '1rem',
              zIndex: 3, // Ensure it is above everything else
            }}
            type="button"
          >
            Why Us?
          </button>
        </div>
      </section>

      {/* Why Us Section */}
      <section
        id="whyus"
        style={{
          height: '100vh',
          backgroundColor: 'black',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <Text fw={700} size="4vw">
          Features
        </Text>

        <div>
          <Text fw={500} size="3vw">
            Learn faster with Socrates Method
          </Text>
        </div>

        <div>
          <Text fw={500} size="3vw">
            Proof Of Learning with Badgepa.cc
          </Text>
        </div>

        <div>
          <Text fw={500} size="3vw">
            Get hired faster with contests and bounties
          </Text>
        </div>
      </section>
    </>
  );
};

export default Landing;
