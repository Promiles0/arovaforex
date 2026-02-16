import { useState, useRef, useCallback } from 'react';

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingObject {
  id: string;
  type: string;
  points: DrawingPoint[];
  style: { color: string; lineWidth: number };
  text?: string;
}

export function useDrawingTools() {
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [activeTool, setActiveTool] = useState('cursor');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const currentDrawingRef = useRef<DrawingObject | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initCanvas = useCallback((container: HTMLDivElement) => {
    // Remove existing canvas if any
    const existing = container.querySelector('canvas.drawing-overlay');
    if (existing) existing.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'drawing-overlay';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '15';
    canvas.style.pointerEvents = 'none';

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    container.appendChild(canvas);
    canvasRef.current = canvas;
  }, []);

  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isVisible) return;

    const allDrawings = [...drawings];
    if (currentDrawingRef.current && currentDrawingRef.current.points.length >= 2) {
      allDrawings.push(currentDrawingRef.current);
    }

    allDrawings.forEach((d) => {
      if (d.points.length < 1) return;
      ctx.strokeStyle = d.style.color;
      ctx.lineWidth = d.style.lineWidth;
      ctx.setLineDash([]);
      ctx.fillStyle = d.style.color;

      const [start, ...rest] = d.points;

      switch (d.type) {
        case 'trendline': {
          if (rest.length === 0) break;
          const end = rest[rest.length - 1];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;
        }
        case 'horizontal': {
          ctx.beginPath();
          ctx.setLineDash([6, 4]);
          ctx.moveTo(0, start.y);
          ctx.lineTo(canvas.width, start.y);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case 'rectangle': {
          if (rest.length === 0) break;
          const end = rest[rest.length - 1];
          ctx.beginPath();
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
          break;
        }
        case 'path': {
          if (d.points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(d.points[0].x, d.points[0].y);
          for (let i = 1; i < d.points.length; i++) {
            ctx.lineTo(d.points[i].x, d.points[i].y);
          }
          ctx.stroke();
          break;
        }
        case 'text': {
          ctx.font = '14px sans-serif';
          ctx.fillText(d.text || 'Text', start.x, start.y);
          break;
        }
        case 'measure': {
          if (rest.length === 0) break;
          const end = rest[rest.length - 1];
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          ctx.setLineDash([]);
          // Show distance label
          const dx = Math.abs(end.x - start.x);
          const dy = Math.abs(end.y - start.y);
          const dist = Math.sqrt(dx * dx + dy * dy).toFixed(0);
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          ctx.font = '12px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${dist}px`, midX + 4, midY - 4);
          break;
        }
      }
    });
  }, [drawings, isVisible]);

  const getCanvasPoint = (e: React.MouseEvent, container: HTMLDivElement): DrawingPoint => {
    const rect = container.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, container: HTMLDivElement) => {
    if (activeTool === 'cursor' || activeTool === 'zoom' || isLocked) return;

    const point = getCanvasPoint(e, container);

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setDrawings((prev) => [...prev, {
          id: Date.now().toString(),
          type: 'text',
          points: [point],
          style: { color: '#ffffff', lineWidth: 1 },
          text,
        }]);
        requestAnimationFrame(renderAll);
      }
      return;
    }

    if (activeTool === 'horizontal') {
      setDrawings((prev) => [...prev, {
        id: Date.now().toString(),
        type: 'horizontal',
        points: [point],
        style: { color: '#FF6D00', lineWidth: 1 },
      }]);
      requestAnimationFrame(renderAll);
      return;
    }

    currentDrawingRef.current = {
      id: Date.now().toString(),
      type: activeTool,
      points: [point],
      style: {
        color: activeTool === 'trendline' ? '#2962FF'
          : activeTool === 'rectangle' ? '#4CAF50'
          : activeTool === 'measure' ? '#00BCD4'
          : '#ffffff',
        lineWidth: 2,
      },
    };
    setIsDrawing(true);

    // Enable pointer events on canvas during drawing
    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = 'auto';
    }
  }, [activeTool, isLocked, renderAll]);

  const handleMouseMove = useCallback((e: React.MouseEvent, container: HTMLDivElement) => {
    if (!isDrawing || !currentDrawingRef.current) return;

    const point = getCanvasPoint(e, container);

    if (currentDrawingRef.current.type === 'path') {
      currentDrawingRef.current.points.push(point);
    } else {
      if (currentDrawingRef.current.points.length === 1) {
        currentDrawingRef.current.points.push(point);
      } else {
        currentDrawingRef.current.points[currentDrawingRef.current.points.length - 1] = point;
      }
    }
    renderAll();
  }, [isDrawing, renderAll]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawingRef.current) return;

    if (currentDrawingRef.current.points.length >= 2) {
      setDrawings((prev) => [...prev, { ...currentDrawingRef.current! }]);
    }
    currentDrawingRef.current = null;
    setIsDrawing(false);

    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = 'none';
    }

    requestAnimationFrame(renderAll);
  }, [isDrawing, renderAll]);

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    currentDrawingRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const toggleLock = useCallback(() => setIsLocked((p) => !p), []);
  const toggleVisibility = useCallback(() => {
    setIsVisible((p) => {
      const next = !p;
      // Defer render to next frame after state update
      requestAnimationFrame(() => renderAll());
      return next;
    });
  }, [renderAll]);

  return {
    drawings,
    activeTool,
    setActiveTool,
    isDrawing,
    isLocked,
    isVisible,
    initCanvas,
    renderAll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearDrawings,
    toggleLock,
    toggleVisibility,
  };
}
