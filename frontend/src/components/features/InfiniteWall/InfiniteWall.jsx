/**
 * Infinite Horizontal Video Wall Component
 * 
 * Creates an infinite scrolling video wall with mixed aspect ratios
 * - Top row: Cinematic (16:9) - YouTube/trailer style
 * - Bottom row: Portrait (9:16) - Mobile video style
 * - Seamless infinite animation with opposite directions
 * - Edge fade effect for smooth transitions
 */

import React from 'react';
import './InfiniteWall.css';

const InfiniteWall = () => {
  // Video sources for top row (Cinematic)
  const topVideos = [
    "/look11.mp4",
    "/look12.mp4", 
    "/look13.mp4",
    "/look14.mp4",
    "/look15.mp4"
  ];

  // Video sources for bottom row (Portrait)
  const bottomVideos = [
    "/bottom1.mp4",
    "/bottom2.mp4", 
    "/bottom3.mp4",
    "/bottom4.mp4",
    "/bottom5.mp4"
  ];

  // Create duplicate sets for seamless infinite scroll
  const createVideoSet = (videos) => {
    // Repeat videos multiple times to ensure seamless scrolling
    const repeatedVideos = [];
    for (let i = 0; i < 6; i++) { // Repeat 6 times for longer track
      repeatedVideos.push(...videos);
    }
    return repeatedVideos;
  };

  const videoSet1 = createVideoSet(topVideos);    // Top row - Cinematic
  const videoSet2 = createVideoSet(bottomVideos); // Bottom row - Portrait

  return (
    <section className="infinite-wall">
      <div className="infinite-wall-container">
        {/* Section Title - Cinematic Two-Line Hierarchy */}
        <div className="section-header">
          <span className="sub-title">Bold Looks, Big Impact</span>
          <h2 className="main-title">Create Without Limits.</h2>
        </div>
        
        {/* Top Row - Cinematic (16:9) - Scrolling Right to Left */}
        <div className="infinite-track">
          <div className="wall-row row-cinematic">
            {videoSet1.map((video, index) => (
              <div key={`cinematic-${index}`} className="wall-card cinematic-card">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  src={video}
                  className="wall-video"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row - Portrait (9:16) - Scrolling Left to Right */}
        <div className="infinite-track">
          <div className="wall-row row-portrait">
            {videoSet2.map((video, index) => (
              <div key={`portrait-${index}`} className="wall-card portrait-card">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  src={video}
                  className="wall-video"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfiniteWall;
