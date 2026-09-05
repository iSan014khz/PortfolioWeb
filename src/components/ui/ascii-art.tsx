"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
} from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/cn";

const ASCII_CHARSETS = {
  standard: " .,:;i1tfLCG08@",
  blocks: " ░▒▓█",
  binary: " 01",
  dots: " ·•●",
  minimal: " .:░▒",
  dense: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  arrows: " ←↑→↓↔↕↖↗↘↙",
  stars: " ·✦✧★",
  hash: " -=#",
  pipes: " |/─\\│",
  braille: " ⠁⠃⠇⠏⠟⠿⡿⣿",
  circles: " ○◔◑◕●",
  squares: " ▢▣▤▥▦▧▨▩",
  hearts: " ♡♥",
  math: " +-×÷=≠≈∞",
} as const;

type CharsetPreset = keyof typeof ASCII_CHARSETS;

const isCharsetPreset = (value: string): value is CharsetPreset => {
  return value in ASCII_CHARSETS;
};

const resolveCharset = (charset: string): string => {
  if (isCharsetPreset(charset)) {
    return ASCII_CHARSETS[charset];
  }
  return charset;
};

const colorCache = new Map<string, string>();

const resolveCssColor = (
  color: string,
  _element: HTMLElement | null,
): string => {
  if (!color) return color;

  if (color.startsWith("var(")) {
    const varName = color.slice(4, -1).trim();
    if (colorCache.has(varName)) return colorCache.get(varName)!;

    if (typeof window !== "undefined") {
      const computedColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (computedColor) {
        colorCache.set(varName, computedColor);
        return computedColor;
      }
    }
    return "#ffffff";
  }

  return color;
};

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

type AsciiArtProps = {
  src: string;
  resolution?: number;
  charset?: CharsetPreset | string;
  color?: string;
  backgroundColor?: string;
  inverted?: boolean;
  colored?: boolean;
  animated?: boolean;
  animationStyle?: "fade" | "typewriter" | "matrix" | "bloom" | "none";
  animationDuration?: number;
  fontFamily?: string;
  className?: string;
  animateOnView?: boolean;
  objectFit?: "cover" | "contain" | "fill";
};

const MATRIX_CHARSET = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";

type AsciiPixel = {
  char: string;
  r: number;
  g: number;
  b: number;
  brightness: number;
};

export const AsciiArt: React.FC<AsciiArtProps> = ({
  src,
  resolution = 80,
  charset = "standard",
  color = "#ffffff",
  backgroundColor = "transparent",
  inverted = false,
  colored = false,
  animated = true,
  animationStyle = "bloom",
  animationDuration = 2.2,
  fontFamily = "monospace",
  className,
  animateOnView = true,
  objectFit = "cover",
}) => {
  const uniqueId = useId();
  const [asciiData, setAsciiData] = useState<AsciiPixel[][]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const progressRef = useRef(0);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const shouldStartAnimation = animated && animateOnView ? isInView : animated;
  const shouldShowStatic = !animated || animationStyle === "none";

  const resolvedCharset = resolveCharset(charset);
  const effectiveCharset = inverted
    ? resolvedCharset.split("").reverse().join("")
    : resolvedCharset;

  const defaultColor = inverted ? "#ffffff" : "#000000";
  const textColor = color || defaultColor;

  useEffect(() => {
    let isCancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (isCancelled) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Canvas context not available");
        return;
      }

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspect = imgWidth / imgHeight;
      const charAspectRatio = 0.55;

      const cols = resolution;
      const rows = Math.floor(cols * charAspectRatio);

      canvas.width = cols;
      canvas.height = rows;

      const visualAspect = 1.0;

      let sx = 0,
        sy = 0,
        sw = imgWidth,
        sh = imgHeight;

      if (objectFit === "cover") {
        if (imgAspect > visualAspect) {
          sw = imgHeight * visualAspect;
          sx = (imgWidth - sw) / 2;
        } else {
          sh = imgWidth / visualAspect;
          sy = (imgHeight - sh) / 2;
        }
      } else if (objectFit === "contain") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cols, rows);

        let dw, dh, dx, dy;
        if (imgAspect > visualAspect) {
          dw = cols;
          dh = (cols / imgAspect) * charAspectRatio;
          dx = 0;
          dy = (rows - dh) / 2;
        } else {
          dh = rows;
          dw = (rows * imgAspect) / charAspectRatio;
          dx = (cols - dw) / 2;
          dy = 0;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      if (objectFit !== "contain") {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      }

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, cols, rows);
      } catch {
        setError("Unable to read image data (CORS issue)");
        return;
      }

      const data = imageData.data;
      const result: AsciiPixel[][] = [];

      for (let y = 0; y < rows; y++) {
        const row: AsciiPixel[] = [];
        for (let x = 0; x < cols; x++) {
          const idx = (y * cols + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          const brightness = a === 0 ? 0 : (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const charIndex = Math.floor(brightness * (effectiveCharset.length - 1));
          const char = effectiveCharset[charIndex] || " ";

          row.push({ char, r, g, b, brightness });
        }
        result.push(row);
      }

      setAsciiData(result);
      setIsLoaded(true);
    };

    img.onerror = () => {
      if (isCancelled) return;
      setError("Failed to load image");
    };

    return () => {
      isCancelled = true;
    };
  }, [src, resolution, effectiveCharset, objectFit]);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return false;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return false;

    if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w, h };
    }

    return true;
  }, []);

  const drawCanvas = useCallback(
    (progress: number, matrixProgress?: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || asciiData.length === 0) return;
      if (!syncCanvasSize()) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w: containerWidth, h: containerHeight } = sizeRef.current;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const resolvedBgColor = resolveCssColor(backgroundColor, container);
      const resolvedTextColor = resolveCssColor(textColor, container);

      if (resolvedBgColor !== "transparent") {
        ctx.fillStyle = resolvedBgColor;
        ctx.fillRect(0, 0, containerWidth, containerHeight);
      } else {
        ctx.clearRect(0, 0, containerWidth, containerHeight);
      }

      const rows = asciiData.length;
      const cols = asciiData[0]?.length || 0;
      if (cols === 0) return;

      const charWidth = containerWidth / cols;
      const charHeight = containerHeight / rows;
      const fontSize = Math.min(charWidth * 1.8, charHeight * 1.2);
      const easedProgress = easeOutQuart(clamp01(progress));
      const useBloom = animationStyle === "bloom";
      const totalChars = rows * cols;
      const revealedChars = Math.floor(easedProgress * totalChars);

      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      let charIndex = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const pixel = asciiData[y][x];
          const u = cols === 1 ? 0.5 : x / (cols - 1);
          const v = rows === 1 ? 0.5 : y / (rows - 1);
          const cx = x * charWidth + charWidth / 2;
          const cy = y * charHeight + charHeight / 2;

          if (animationStyle === "typewriter" && charIndex >= revealedChars) {
            charIndex++;
            continue;
          }

          let displayChar = pixel.char;
          let displayColor = colored
            ? `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`
            : resolvedTextColor;
          let alpha = animationStyle === "fade" ? easedProgress : 1;
          let sizeMul = 1;

          if (animationStyle === "matrix" && matrixProgress !== undefined) {
            const charProgress = (x * 0.02 + y * 0.01) / 2;
            if (matrixProgress < charProgress) {
              charIndex++;
              continue;
            } else if (matrixProgress < charProgress + 0.15) {
              displayChar =
                MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)];
              displayColor = "#00ff00";
              ctx.shadowColor = "#00ff00";
              ctx.shadowBlur = 5;
            } else {
              ctx.shadowBlur = 0;
            }
          }

          if (useBloom) {
            const dist = Math.hypot(u - 0.5, v - 0.7);
            const appearAt = dist * 0.58 + (1 - pixel.brightness) * 0.2;
            const local = smoothstep(clamp01((easedProgress - appearAt) / 0.26));
            if (local <= 0.02) {
              charIndex++;
              continue;
            }
            alpha = local;
            sizeMul = 0.55 + local * 0.45;
          }

          ctx.globalAlpha = alpha;
          ctx.font = `${fontSize * sizeMul}px ${fontFamily}`;
          ctx.fillStyle = displayColor;
          ctx.fillText(displayChar, cx, cy);
          ctx.shadowBlur = 0;
          charIndex++;
        }
      }

      ctx.globalAlpha = 1;
    },
    [
      asciiData,
      backgroundColor,
      colored,
      textColor,
      fontFamily,
      animationStyle,
      syncCanvasSize,
    ],
  );

  useEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;

    let startTime: number | null = null;
    const duration = animationDuration * 1000;

    const tick = (now: number) => {
      if (shouldShowStatic) {
        progressRef.current = 1;
      } else if (shouldStartAnimation) {
        if (startTime === null) startTime = now;
        progressRef.current = clamp01((now - startTime) / duration);
      } else {
        progressRef.current = 0;
      }

      if (animationStyle === "matrix") {
        drawCanvas(1, progressRef.current);
      } else {
        drawCanvas(progressRef.current);
      }

      if (progressRef.current < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(() => {
      sizeRef.current = { w: 0, h: 0 };
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isLoaded,
    asciiData,
    shouldStartAnimation,
    shouldShowStatic,
    animationStyle,
    animationDuration,
    drawCanvas,
  ]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-mono text-sm text-red-500",
          className,
        )}
      >
        Error: {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex animate-pulse items-center justify-center font-mono text-sm text-neutral-500",
          className,
        )}
        style={{ backgroundColor }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      <canvas
        key={uniqueId}
        id={`ascii-canvas-${uniqueId}`}
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="ASCII art rendering of image"
        role="img"
      />
    </div>
  );
};

export const AsciiArtStatic: React.FC<
  Omit<AsciiArtProps, "animated" | "animationStyle">
> = (props) => {
  return <AsciiArt {...props} animated={false} animationStyle="none" />;
};
