'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

type SpotlightProps = {
  className?: string;
  size?: number;
  fill?: string;
};

export function Spotlight({
  className,
  size = 360,
  fill = "white",
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    parent.style.position = 'relative';

    const handleMouseMove = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setPos({ x, y });
      setIsHovered(true);
    };

    const handleMouseEnter = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      setPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    parent.addEventListener('mousemove', handleMouseMove, { passive: true });
    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute top-0 left-0 rounded-full blur-2xl mix-blend-screen transition-opacity duration-200',
        isHovered ? 'opacity-80' : 'opacity-0',
        className
      )}
      style={{
        width: size,
        height: size,
        transform: `translate3d(${pos.x - size / 2}px, ${pos.y - size / 2}px, 0)`,
        willChange: 'transform',
        background: fill === "white"
          ? 'radial-gradient(circle at center, rgba(255, 255, 255, 0.85) 0%, rgba(56, 189, 248, 0.45) 25%, rgba(6, 182, 212, 0.15) 50%, transparent 70%)'
          : `radial-gradient(circle at center, ${fill}, transparent 70%)`,
      }}
    />
  );
}

