import { Pigment } from '../../contexts/SpectrumContext';

/**
 * Color matrices and CSS filter generators for Sumi-e ink wash and chromatic perception shifts.
 */

export const PIGMENT_COLORS: Record<Pigment, string> = {
  'frost-cyan': '#48cae4',
  'abyssal-navy': '#1d3557',
  'sky-cerulean': '#90e0ef',
  'molten-gold': '#e0a96d',
  'emerald-jade': '#2d6a4f',
  'rushing-teal': '#0077b6',
  'blood-vermilion': '#b3312c',
  'full-spectrum': '#7209b7',
};

/**
 * Generates dynamic CSS style object based on whether a pigment is unlocked or active.
 */
export const getPigmentGlowStyle = (pigment: Pigment, isUnlocked: boolean): React.CSSProperties => {
  const color = PIGMENT_COLORS[pigment];
  if (!isUnlocked) {
    return {
      borderColor: 'rgba(244, 235, 208, 0.15)',
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      color: 'rgba(244, 235, 208, 0.3)',
      boxShadow: 'none',
    };
  }

  return {
    borderColor: color,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    color: color,
    boxShadow: `0 0 16px ${color}40, inset 0 0 12px ${color}20`,
  };
};

/**
 * Generates an SVG feColorMatrix filter values string to tint monochrome images to a given pigment.
 */
export const getFeColorMatrix = (hex: string): string => {
  // Parse hex to normalized rgb (0..1)
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  return `
    ${r} 0 0 0 0
    0 ${g} 0 0 0
    0 0 ${b} 0 0
    0 0 0 1 0
  `.trim().replace(/\s+/g, ' ');
};
