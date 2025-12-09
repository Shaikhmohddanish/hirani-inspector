"use client";

import { useEffect, useRef, useState } from "react";
import { AnnotationBox } from "@/store/useAppStore";

type ImageCanvasProps = {
  imageSrc: string;
  boxes: AnnotationBox[];
  onBoxAdded?: (box: AnnotationBox) => void;
  onBoxRemoved?: (boxId: string) => void;
  readonly?: boolean;
};

export function ImageCanvas({ imageSrc, boxes, onBoxAdded, onBoxRemoved, readonly = false }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<[number, number, number, number] | null>(null);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate scale to fit container
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    setScale(newScale);

    const displayWidth = image.width * newScale;
    const displayHeight = image.height * newScale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);

    // Draw existing boxes
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    boxes.forEach((box) => {
      const [x1, y1, x2, y2] = box.coords;
      ctx.strokeRect(x1 * newScale, y1 * newScale, (x2 - x1) * newScale, (y2 - y1) * newScale);
    });

    // Draw current box being drawn
    if (currentBox) {
      const [x1, y1, x2, y2] = currentBox;
      ctx.strokeRect(x1 * newScale, y1 * newScale, (x2 - x1) * newScale, (y2 - y1) * newScale);
    }
  }, [image, boxes, currentBox, scale]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentBox([coords.x, coords.y, coords.x, coords.y]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || readonly) return;
    const coords = getCanvasCoords(e);
    setCurrentBox([startPoint.x, startPoint.y, coords.x, coords.y]);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !currentBox || readonly) return;
    const coords = getCanvasCoords(e);
    const x1 = Math.min(startPoint.x, coords.x);
    const y1 = Math.min(startPoint.y, coords.y);
    const x2 = Math.max(startPoint.x, coords.x);
    const y2 = Math.max(startPoint.y, coords.y);

    // Only add if box is big enough
    if (Math.abs(x2 - x1) > 5 && Math.abs(y2 - y1) > 5) {
      const newBox: AnnotationBox = {
        id: `box-${Date.now()}`,
        coords: [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)],
      };
      onBoxAdded?.(newBox);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      <canvas
        ref={canvasRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDrawing(false);
          setCurrentBox(null);
        }}
      />
      {!readonly && (
        <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-2 text-xs text-white">
          Click and drag to draw annotation boxes
        </div>
      )}
      {boxes.length > 0 && !readonly && (
        <div className="absolute right-4 top-4 max-h-48 overflow-y-auto rounded-lg bg-black/80 p-3">
          <p className="mb-2 text-xs font-semibold text-white">Boxes ({boxes.length})</p>
          <ul className="space-y-1">
            {boxes.map((box) => (
              <li key={box.id} className="flex items-center justify-between gap-2 text-xs text-white">
                <span className="truncate">{box.coords.map((c) => Math.round(c)).join(", ")}</span>
                <button
                  onClick={() => onBoxRemoved?.(box.id)}
                  className="text-rose-400 hover:text-rose-300"
                  type="button"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
