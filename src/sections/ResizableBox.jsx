import { useState, useRef } from "react";

export default function ResizableBox({ 
  children, 
  minWidth = 320, 
  minHeight = 300, 
  initialWidth = 420, 
  initialHeight = 500 
}) {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const resizing = useRef(null);

  const startResize = (e, direction) => {
    e.preventDefault();
    resizing.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
      direction,
    };
    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  const doResize = (e) => {
    if (!resizing.current) return;
    const { startX, startY, startWidth, startHeight, direction } = resizing.current;
    let newWidth = startWidth;
    let newHeight = startHeight;

    if (direction.includes("e")) newWidth = Math.max(minWidth, startWidth + (e.clientX - startX));
    if (direction.includes("s")) newHeight = Math.max(minHeight, startHeight + (e.clientY - startY));
    if (direction.includes("w")) newWidth = Math.max(minWidth, startWidth - (e.clientX - startX));
    if (direction.includes("n")) newHeight = Math.max(minHeight, startHeight - (e.clientY - startY));

    setSize({ width: newWidth, height: newHeight });
  };

  const stopResize = () => {
    resizing.current = null;
    document.removeEventListener("mousemove", doResize);
    document.removeEventListener("mouseup", stopResize);
  };

  return (
    <div
      className="relative bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-violet-200 flex flex-col overflow-hidden"
      style={{ width: size.width, height: size.height }}
    >
      {children}

      {/* Resize handles (all 8 directions) */}
      <div className="absolute top-0 left-0 w-full h-1 cursor-n-resize" onMouseDown={(e) => startResize(e, "n")} />
      <div className="absolute bottom-0 left-0 w-full h-1 cursor-s-resize" onMouseDown={(e) => startResize(e, "s")} />
      <div className="absolute top-0 left-0 h-full w-1 cursor-w-resize" onMouseDown={(e) => startResize(e, "w")} />
      <div className="absolute top-0 right-0 h-full w-1 cursor-e-resize" onMouseDown={(e) => startResize(e, "e")} />
      <div className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize" onMouseDown={(e) => startResize(e, "nw")} />
      <div className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize" onMouseDown={(e) => startResize(e, "ne")} />
      <div className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" onMouseDown={(e) => startResize(e, "sw")} />
      <div className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" onMouseDown={(e) => startResize(e, "se")} />
    </div>
  );
}
