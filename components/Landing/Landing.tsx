'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Text, Box, Group, Container } from '@mantine/core';
import { useRouter } from 'next/navigation';

const Landing: React.FC = () => {
  const duckRef = useRef<HTMLDivElement | null>(null);
  const [, setShowButton] = useState(true); // Removed `_`, as it's not used.
  const radius = 200; // Radius within which the duck will remain
  const initialTransform = 'translate(-50%, -50%) rotate(30deg)'; // Initial transform for the duck

  const router = useRouter();
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

      {/* Why Us Section - Improved */}
      <section
        id="whyus"
        style={{
          minHeight: '100vh',
          backgroundColor: 'black',
          color: 'white',
          padding: '4rem 2rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container size="xl">
          {/* Section Header */}
          <Box mb={60} style={{ textAlign: 'center' }}>
            <Text
              fw={800}
              size="3rem"
              
            >
              Why Choose Intui?
            </Text>
            <Text size="xl" c="dimmed" maw={700} mx="auto">
              Elevate your interview preparation with our AI-powered platform
            </Text>
          </Box>

          {/* Feature Cards */}
          <Box 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              marginBottom: '4rem',
            }}
          >
            {/* Feature 1 */}
            <Box
              p="xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s ease',
                ':hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Box 
                mb="md" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
                  marginBottom: '1.5rem',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M20 3H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM19 17H5v-1c0-1 4-2 5-2h4c1 0 5 1 5 2v1z"></path>
                </svg>
              </Box>
              <Text fw={700} size="xl" mb="xs">
                Socratic Learning Method
              </Text>
              <Text c="dimmed" size="md">
                Our AI uses guided questioning techniques to help you understand concepts deeply rather than memorizing answers.
              </Text>
            </Box>

            {/* Feature 2 */}
            <Box
              p="xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s ease',
                ':hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Box 
                mb="md" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #4ECDC4, #556270)',
                  marginBottom: '1.5rem',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L9 13.17l6.59-6.59L17 8l-7 7z"></path>
                </svg>
              </Box>
              <Text fw={700} size="xl" mb="xs">
                Verified Skill Badges
              </Text>
              <Text c="dimmed" size="md">
                Earn verifiable badges through Badgepa.cc that showcase your interview skills to potential employers.
              </Text>
            </Box>

            {/* Feature 3 */}
            <Box
              p="xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s ease',
                ':hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Box 
                mb="md" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #4CB8C4, #3CD3AD)',
                  marginBottom: '1.5rem',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
                </svg>
              </Box>
              <Text fw={700} size="xl" mb="xs">
                Contests & Bounties
              </Text>
              <Text c="dimmed" size="md">
                Participate in employer-sponsored challenges to get noticed and fast-track your hiring process.
              </Text>
            </Box>
          </Box>

          {/* Safari Mockup */}
          <Box 
            style={{ 
              maxWidth: '900px', 
              margin: '0 auto',
              boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Browser Window Header */}
            <Box 
              style={{
                background: 'linear-gradient(to bottom, #f2f2f2, #e5e5e5)',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 15px',
              }}
            >
              {/* Traffic Lights */}
              <Group>
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></Box>
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></Box>
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></Box>
              </Group>
              
              {/* URL Bar */}
              <Box 
                ml="lg" 
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                }}
              >
                <Text size="xs" c="dimmed">https://intui.vercel.app</Text>
              </Box>
            </Box>

            {/* Browser Content */}
            <Box 
              style={{
                backgroundColor: '#1a1a1a',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                padding: '20px',
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundImage: 'url(/intui-mockup.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              {/* If you don't have a screenshot yet, show a placeholder */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}>
                <Text fw={700} size="xl" mb="md">Experience Intui in Action</Text>
                <Text c="dimmed" ta="center" maw={600}>
                  Engage with our intelligent duck assistant to prepare for interviews through natural conversation and guided learning.
                </Text>
                <button
                  style={{
                    marginTop: '2rem',
                    padding: '0.75rem 1.5rem',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => router.push('/signup')}
                  type="button"
                >
                  Try Intui Now
                </button>
              </div>
            </Box>
          </Box>
        </Container>
      </section>
    </>
  );
};

export default Landing;