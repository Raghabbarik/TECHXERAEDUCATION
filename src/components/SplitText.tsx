
'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

/**
 * @fileOverview A high-performance text splitting component for GSAP animations.
 * Splits text into characters or words and animates them on scroll.
 */

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 30,
  duration = 0.8,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  tag = 'p',
  textAlign = 'left',
  onLetterAnimationComplete
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Split text into characters or words
  const elements = useMemo(() => {
    if (splitType === 'words') {
      return text.split(' ').map((word, i) => ({ 
        id: i, 
        text: word + (i === text.split(' ').length - 1 ? '' : '\u00A0') 
      }));
    }
    return text.split('').map((char, i) => ({ 
      id: i, 
      text: char === ' ' ? '\u00A0' : char 
    }));
  }, [text, splitType]);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

    const items = containerRef.current.querySelectorAll('.split-item');
    
    gsap.fromTo(items, from, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      scrollTrigger: {
        trigger: containerRef.current,
        start: `top bottom-=${threshold * 100}%`,
        toggleActions: 'play none none none',
        once: true,
      },
      onComplete: onLetterAnimationComplete,
      force3D: true,
      willChange: 'transform, opacity'
    });
  }, { dependencies: [mounted, elements], scope: containerRef });

  if (!mounted) return <span className={className}>{text}</span>;

  const Tag = tag as any;

  return (
    <Tag
      ref={containerRef}
      className={className}
      style={{ textAlign, display: 'inline-block' }}
    >
      {elements.map((item) => (
        <span
          key={item.id}
          className="split-item inline-block"
          style={{ willChange: 'transform, opacity' }}
        >
          {item.text}
        </span>
      ))}
    </Tag>
  );
};

export default SplitText;
