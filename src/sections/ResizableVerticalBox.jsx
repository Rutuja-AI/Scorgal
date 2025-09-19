import { useState, useRef } from "react";

export default function ResizableVerticalBox({
  children,
  minHeight = 150,
  initialHeight = 250,
}) {
  const [height, setHeight] = useState(initialHeight);
  const resizing = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    resizing.current = {
      startY: e.clientY,
      startHeight: height,
    };
    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  const doResize = (e) => {
    if (!resizing.current) return;
    const { startY, startHeight } = resizing.current;
    let newHeight = Math.max(minHeight, startHeight - (e.clientY - startY));
    setHeight(newHeight);
  };

  const stopResize = () => {
    resizing.current = null;
    document.removeEventListener("mousemove", doResize);
    document.removeEventListener("mouseup", stopResize);
  };

  return (
    <div
      className="relative bg-gradient-to-r from-violet-50 to-white rounded-xl border border-violet-100 shadow-inner flex flex-col overflow-hidden"
      style={{ height }}
    >
      {children}

      {/* Drag handle (top edge only) */}
      <div
        className="absolute top-0 left-0 w-full h-2 cursor-n-resize bg-transparent"
        onMouseDown={startResize}
      />
    </div>
  );
}
