import { Capacitor } from "@capacitor/core";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right";
}

const isNative = Capacitor.isNativePlatform();

const directionMap = {
  up: { y: 16, x: 0 },
  left: { x: -20, y: 0 },
  right: { x: 20, y: 0 },
};

export const ScrollReveal = ({ children, delay = 0, className, direction = "up" }: Props) => {
  // On native iOS/Android, skip animation entirely — blur filter is too expensive for WebView
  if (isNative) {
    return <div className={className}>{children}</div>;
  }

  const offset = directionMap[direction];
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)", ...offset }}
      whileInView={{ opacity: 1, filter: "blur(0px)", x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
