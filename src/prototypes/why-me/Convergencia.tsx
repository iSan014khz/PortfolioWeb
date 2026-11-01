import { type MotionValue } from 'motion/react';
import SvgScrollTitle from './SvgScrollTitle';
export default function Convergencia({ progress }: { progress: MotionValue<number> }) {
  return <SvgScrollTitle progress={progress} direction="convergencia" />;
}
