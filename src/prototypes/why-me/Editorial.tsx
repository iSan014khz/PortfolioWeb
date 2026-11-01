import { type MotionValue } from 'motion/react';
import SvgScrollTitle from './SvgScrollTitle';
export default function Editorial({ progress }: { progress: MotionValue<number> }) {
  return <SvgScrollTitle progress={progress} direction="editorial" />;
}
