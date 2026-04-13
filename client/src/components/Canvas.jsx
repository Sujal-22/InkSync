import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import "./Canvas.css";

export default function Canvas({ isDrawing }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const strokesRef = useRef([]);
  const currentStroke = useRef([]);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);

  const COLORS = [
    "#000000",
    "#ffffff",
    "#e94560",
    "#ff6b35",
    "#ffc800",
    "#4caf50",
    "#2196f3",
    "#9c27b0",
    "#ff69b4",
    "#00bcd4",
    "#795548",
    "#607d8b",
    "#f44336",
    "#ff9800",
    "#ffeb3b",
    "#8bc34a",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    socket.on("draw_start", ({ x, y, color, size, tool }) => {
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = size;
    });

    socket.on("draw_move", ({ x, y }) => {
      const ctx = ctxRef.current;
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on("draw_end", () => {
      ctxRef.current.beginPath();
    });

    socket.on("canvas_clear", () => clearCanvasLocal());

    socket.on("draw_undo", ({ strokes }) => redrawStrokes(strokes));

    return () => {
      socket.off("draw_start");
      socket.off("draw_move");
      socket.off("draw_end");
      socket.off("canvas_clear");
      socket.off("draw_undo");
    };
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    if (!isDrawing) return;
    drawing.current = true;
    const pos = getPos(e);
    currentStroke.current = [pos];

    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = size;

    socket.emit("draw_start", { x: pos.x, y: pos.y, color, size, tool });
  };

  const moveDraw = (e) => {
    if (!isDrawing || !drawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    currentStroke.current.push(pos);

    const ctx = ctxRef.current;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    socket.emit("draw_move", { x: pos.x, y: pos.y });
  };

  const endDraw = () => {
    if (!isDrawing || !drawing.current) return;
    drawing.current = false;
    strokesRef.current.push({
      points: currentStroke.current,
      color,
      size,
      tool,
    });
    currentStroke.current = [];
    ctxRef.current.beginPath();
    socket.emit("draw_end");
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
  };

  const handleClear = () => {
    clearCanvasLocal();
    socket.emit("canvas_clear");
  };

  const handleUndo = () => {
    strokesRef.current.pop();
    redrawStrokes(strokesRef.current);
    socket.emit("draw_undo", { strokes: strokesRef.current });
  };

  const redrawStrokes = (strokes) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = strokes;
    strokes.forEach((stroke) => {
      if (!stroke.points.length) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((p) => {
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
      ctx.beginPath();
    });
  };

  return (
    <div className="canvas-wrapper">
      {/* Toolbar */}
      {isDrawing && (
        <div className="canvas-toolbar">
          {/* Colors */}
          <div className="canvas-colors">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`canvas-color-btn ${color === c && tool === "pen" ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
              />
            ))}
          </div>

          <div className="canvas-divider" />

          {/* Tools */}
          <div className="canvas-tools">
            <button
              className={`canvas-tool-btn ${tool === "pen" ? "active" : ""}`}
              onClick={() => setTool("pen")}
              title="Pen"
            >
              ✏️
            </button>
            <button
              className={`canvas-tool-btn ${tool === "eraser" ? "active" : ""}`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              🧹
            </button>
            <button
              className="canvas-tool-btn"
              onClick={handleUndo}
              title="Undo"
            >
              ↩️
            </button>
            <button
              className="canvas-tool-btn danger"
              onClick={handleClear}
              title="Clear"
            >
              🗑️
            </button>
          </div>

          <div className="canvas-divider" />

          {/* Size */}
          <div className="canvas-size">
            <div
              className="canvas-size-preview"
              style={{
                width: Math.min(size, 30),
                height: Math.min(size, 30),
                background: tool === "eraser" ? "#ccc" : color,
              }}
            />
            <input
              type="range"
              min={2}
              max={40}
              value={size}
              onChange={(e) => setSize(+e.target.value)}
              className="canvas-size-slider"
            />
            <span className="canvas-size-label">{size}px</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`draw-canvas ${isDrawing ? "can-draw" : ""}`}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />

      {/* Viewer overlay */}
      {!isDrawing && <div className="canvas-viewer-tag">👀 Viewing</div>}
    </div>
  );
}
