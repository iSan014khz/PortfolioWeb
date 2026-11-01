import { type MotionValue } from 'motion/react';
import SvgScrollTitle from './SvgScrollTitle';
export default function Bisagra({ progress }: { progress: MotionValue<number> }) {
  return <SvgScrollTitle progress={progress} direction="bisagra" />;
}
