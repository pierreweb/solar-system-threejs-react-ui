import React from 'react';
import { Html } from '@react-three/drei';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface SolarLabelProps {
  text: string;
  isDark: boolean;
  position: [number, number, number];
  distanceFactor?: number;
}

export function SolarLabel({
  text,
  isDark,
  position,
  distanceFactor = 10,
}: SolarLabelProps) {
  return (
    <Html position={position} center distanceFactor={distanceFactor}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest whitespace-nowrap pointer-events-none transition-colors',
          isDark
            ? 'bg-black/80 border-gold-neon/50 text-gold-neon neon-glow-gold'
            : 'bg-white/80 border-mist-primary/50 text-mist-primary shadow-lg',
        )}
      >
        {text}
      </motion.div>
    </Html>
  );
}
