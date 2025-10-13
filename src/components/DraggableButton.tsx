import React, { useState, useRef, useEffect, useCallback } from "react";

interface DraggableButtonProps {
  children: React.ReactNode;
  onDragEnd?: (position: { x: number; y: number }) => void;
}

const DraggableButton: React.FC<DraggableButtonProps> = ({
  children,
  onDragEnd,
}) => {
  const [position, setPosition] = useState({
    x: window.innerWidth - 100, // Default to top-right, adjusted for button width
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem("draggableButtonPosition");
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Set initial top-right position if not found in localStorage
      if (buttonRef.current) {
        setPosition({
          x: window.innerWidth - buttonRef.current.offsetWidth - 20, // 20px from right edge
          y: 20, // 20px from top edge
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isDragging && buttonRef.current) {
        if ("touches" in e) {
          e.preventDefault(); // Prevent page scrolling on touch devices
        }
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const newX = clientX - offset.current.x;
        const newY = clientY - offset.current.y;

        // Keep button within viewport
        const maxX = window.innerWidth - buttonRef.current.offsetWidth;
        const maxY = window.innerHeight - buttonRef.current.offsetHeight;

        setPosition({
          x: Math.min(Math.max(0, newX), maxX),
          y: Math.min(Math.max(0, newY), maxY),
        });
      }
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    localStorage.setItem("draggableButtonPosition", JSON.stringify(position));
    if (onDragEnd) {
      onDragEnd(position);
    }
  }, [onDragEnd, position]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (buttonRef.current) {
      setIsDragging(true);
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      offset.current = {
        x: clientX - buttonRef.current.getBoundingClientRect().left,
        y: clientY - buttonRef.current.getBoundingClientRect().top,
      };
    }
  };

  return (
    <div
      ref={buttonRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: 1000, // Ensure it's above other content
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default DraggableButton;
