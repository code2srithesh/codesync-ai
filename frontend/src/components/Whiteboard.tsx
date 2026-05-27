import React, { useRef, useState, useEffect } from 'react';
import { Square, Circle, Minus, Paintbrush, Eraser, Trash2 } from 'lucide-react';
import { useCollabStore, WhiteboardElement } from '../store/useCollabStore';

interface WhiteboardProps {
  roomCode: string;
  stompClient: any;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomCode, stompClient }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { whiteboardElements, addWhiteboardElement, setWhiteboardElements } = useCollabStore();

  const [tool, setTool] = useState<'free' | 'rect' | 'circle' | 'line' | 'eraser'>('free');
  const [color, setColor] = useState<string>('#a855f7'); // purple-500 default
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);

  // Initialize canvas configurations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Support high DPI screens
    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 500;
    canvas.width = width;
    canvas.height = height;

    context.lineCap = 'round';
    context.lineJoin = 'round';

    redrawCanvas();
  }, []);

  // Sync redraw redraw when store elements update
  useEffect(() => {
    redrawCanvas();
  }, [whiteboardElements]);

  // Handle inbound whiteboard drawings
  useEffect(() => {
    if (!stompClient) return;

    const subscription = stompClient.subscribe(`/topic/room/${roomCode}/whiteboard`, (message: any) => {
      const payload = JSON.parse(message.body);
      
      // Prevent echoing back self actions
      if (payload.sender === stompClient.ws?.url) return; 

      if (payload.action === 'DRAW') {
        const elem: WhiteboardElement = payload.element;
        // Verify element doesn't exist to prevent redundancy
        if (!whiteboardElements.some(e => e.id === elem.id)) {
          addWhiteboardElement(elem);
        }
      } else if (payload.action === 'CLEAR') {
        setWhiteboardElements([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [stompClient, roomCode, whiteboardElements]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    whiteboardElements.forEach(elem => {
      drawElement(context, elem);
    });
  };

  const drawElement = (context: CanvasRenderingContext2D, elem: WhiteboardElement) => {
    context.strokeStyle = elem.color;
    context.lineWidth = elem.strokeWidth;
    context.beginPath();

    if (elem.type === 'free' || elem.type === 'line') {
      if (elem.points.length < 2) return;
      context.moveTo(elem.points[0].x, elem.points[0].y);
      for (let i = 1; i < elem.points.length; i++) {
        context.lineTo(elem.points[i].x, elem.points[i].y);
      }
      context.stroke();
    } else if (elem.type === 'rect') {
      if (elem.points.length < 2) return;
      const start = elem.points[0];
      const end = elem.points[elem.points.length - 1];
      context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (elem.type === 'circle') {
      if (elem.points.length < 2) return;
      const start = elem.points[0];
      const end = elem.points[elem.points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      context.stroke();
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    setIsDrawing(true);

    const newElement: WhiteboardElement = {
      id: Math.random().toString(36).substring(7),
      type: tool === 'eraser' ? 'free' : tool,
      points: [coords],
      color: tool === 'eraser' ? '#09090b' : color, // dark background color for eraser
      strokeWidth: tool === 'eraser' ? 24 : lineWidth
    };

    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;
    const coords = getCoordinates(e);
    
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    let updatedPoints = [...currentElement.points];
    if (currentElement.type === 'free') {
      updatedPoints.push(coords);
    } else {
      // Shape boundaries track start index and active mouse coords
      updatedPoints = [currentElement.points[0], coords];
    }

    const updatedElement = { ...currentElement, points: updatedPoints };
    setCurrentElement(updatedElement);

    // Live intermediate redraws
    redrawCanvas();
    drawElement(context, updatedElement);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);

    // Save drawn elements inside store
    addWhiteboardElement(currentElement);

    // Broadcast coordinate data to STOMP peers
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomCode}/whiteboard-draw`,
        body: JSON.stringify({
          action: 'DRAW',
          element: currentElement
        })
      });
    }

    setCurrentElement(null);
  };

  const handleClear = () => {
    setWhiteboardElements([]);

    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/room/${roomCode}/whiteboard-draw`,
        body: JSON.stringify({
          action: 'CLEAR'
        })
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 rounded-2xl border border-white/5 overflow-hidden">
      {/* Upper drawing tools bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-white/5 bg-dark-800/40">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setTool('free')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === 'free' ? 'bg-brand-purple text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Brush Draw"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setTool('rect')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === 'rect' ? 'bg-brand-purple text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setTool('circle')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === 'circle' ? 'bg-brand-purple text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setTool('line')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === 'line' ? 'bg-brand-purple text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tool === 'eraser' ? 'bg-brand-purple text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Colors panel */}
          {tool !== 'eraser' && (
            <div className="flex gap-2">
              {['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#ffffff'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    color === c ? 'scale-125 border-white ring-2 ring-brand-purple/40' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          {/* Stroke Width */}
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span>Size</span>
            <input 
              type="range" 
              min="1" 
              max="12" 
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-16 accent-brand-purple"
            />
          </div>

          <button 
            onClick={handleClear}
            className="p-2 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 rounded-xl transition-all"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Canvas Workspace */}
      <div className="flex-1 relative bg-dark-900 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
