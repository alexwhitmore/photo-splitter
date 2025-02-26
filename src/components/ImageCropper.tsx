import { useState, useEffect, useRef, forwardRef, useImperativeHandle, type MouseEvent } from 'react';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageSize {
  width: number;
  height: number;
}

interface DragPosition {
  x: number;
  y: number;
}

interface ImageCropperProps {
  image: string;
  onCropChange?: (cropData: CropData) => void;
  isFollower?: boolean;
}

export interface ImageCropperRef {
  crop: () => Promise<string>;
  getCropData: () => CropData;
  setCropData: (data: CropData) => void;
}

type DragType = false | 'move' | 'n-resize' | 's-resize' | 'e-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize';

const ImageCropper = forwardRef<ImageCropperRef, ImageCropperProps>(({ 
  image, 
  onCropChange, 
  isFollower = false 
}, ref) => {
  const [cropData, setCropData] = useState<CropData>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState<DragType>(false);
  const [dragStart, setDragStart] = useState<DragPosition>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    crop: () =>
      new Promise<string>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          const scaleX = img.naturalWidth / imageSize.width;
          const scaleY = img.naturalHeight / imageSize.height;
          const scaledCrop = {
            x: cropData.x * scaleX,
            y: cropData.y * scaleY,
            width: cropData.width * scaleX,
            height: cropData.height * scaleY,
          };
          canvas.width = scaledCrop.width;
          canvas.height = scaledCrop.height;
          if (ctx) {
            ctx.drawImage(img, scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height, 0, 0, scaledCrop.width, scaledCrop.height);
          }
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = image;
      }),
    getCropData: () => cropData,
    setCropData: (data: CropData) => setCropData(data),
  }));

  useEffect(() => {
    if (image && containerRef.current) {
      const img = new Image();
      img.onload = () => {
        const containerWidth = containerRef.current!.clientWidth;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const displayWidth = containerWidth;
        const displayHeight = displayWidth / aspectRatio;
        setImageSize({ width: displayWidth, height: displayHeight });
        setCropData({
          x: displayWidth * 0.1,
          y: displayHeight * 0.1,
          width: displayWidth * 0.8,
          height: displayHeight * 0.8,
        });
      };
      img.src = image;
    }
  }, [image]);

  useEffect(() => {
    if (onCropChange && !isFollower) onCropChange(cropData);
  }, [cropData, onCropChange, isFollower]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isFollower || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edgeSize = 10;
    const onLeftEdge = Math.abs(x - cropData.x) <= edgeSize;
    const onRightEdge = Math.abs(x - (cropData.x + cropData.width)) <= edgeSize;
    const onTopEdge = Math.abs(y - cropData.y) <= edgeSize;
    const onBottomEdge = Math.abs(y - (cropData.y + cropData.height)) <= edgeSize;
    
    if (onRightEdge && onBottomEdge) {
      setIsDragging('se-resize');
    } else if (onRightEdge && onTopEdge) {
      setIsDragging('ne-resize');
    } else if (onLeftEdge && onBottomEdge) {
      setIsDragging('sw-resize');
    } else if (onLeftEdge && onTopEdge) {
      setIsDragging('nw-resize');
    } else if (onRightEdge) {
      setIsDragging('e-resize');
    } else if (onLeftEdge) {
      setIsDragging('w-resize');
    } else if (onTopEdge) {
      setIsDragging('n-resize');
    } else if (onBottomEdge) {
      setIsDragging('s-resize');
    } else if (x >= cropData.x && x <= cropData.x + cropData.width && y >= cropData.y && y <= cropData.y + cropData.height) {
      setIsDragging('move');
    }
    
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || isFollower || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    let newCropData: CropData = { ...cropData };
    
    if (isDragging === 'move') {
      newCropData = {
        ...cropData,
        x: Math.max(0, Math.min(imageSize.width - cropData.width, cropData.x + deltaX)),
        y: Math.max(0, Math.min(imageSize.height - cropData.height, cropData.y + deltaY)),
      };
    } else if (isDragging.includes('e-resize')) {
      const newWidth = Math.max(50, Math.min(imageSize.width - cropData.x, cropData.width + deltaX));
      newCropData = { ...cropData, width: newWidth };
    } else if (isDragging.includes('w-resize')) {
      const newWidth = Math.max(50, cropData.width - deltaX);
      const newX = Math.max(0, Math.min(cropData.x + cropData.width - 50, cropData.x + deltaX));
      newCropData = { ...cropData, x: newX, width: newWidth };
    }
    
    if (isDragging.includes('s-resize')) {
      const newHeight = Math.max(50, Math.min(imageSize.height - cropData.y, cropData.height + deltaY));
      newCropData = { ...newCropData, height: newHeight };
    } else if (isDragging.includes('n-resize')) {
      const newHeight = Math.max(50, cropData.height - deltaY);
      const newY = Math.max(0, Math.min(cropData.y + cropData.height - 50, cropData.y + deltaY));
      newCropData = { ...newCropData, y: newY, height: newHeight };
    }
    
    setCropData(newCropData);
    setDragStart({ x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getCursor = (): string => {
    if (isFollower) return 'not-allowed';
    if (isDragging) return isDragging;
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className="relative border border-gray-300 rounded-lg overflow-hidden"
      style={{ height: imageSize.height + 'px', cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {image && (
        <>
          <img
            src={image}
            alt="Crop preview"
            className="absolute top-0 left-0"
            style={{ width: imageSize.width + 'px', height: imageSize.height + 'px' }}
          />
          
          <div className="absolute bg-black bg-opacity-50" 
               style={{ left: 0, top: 0, width: '100%', height: cropData.y + 'px' }} />
          
          <div className="absolute bg-black bg-opacity-50" 
               style={{ left: 0, top: (cropData.y + cropData.height) + 'px', width: '100%', height: (imageSize.height - cropData.y - cropData.height) + 'px' }} />
          
          <div className="absolute bg-black bg-opacity-50" 
               style={{ left: 0, top: cropData.y + 'px', width: cropData.x + 'px', height: cropData.height + 'px' }} />
          
          <div className="absolute bg-black bg-opacity-50" 
               style={{ left: (cropData.x + cropData.width) + 'px', top: cropData.y + 'px', width: (imageSize.width - cropData.x - cropData.width) + 'px', height: cropData.height + 'px' }} />
          
          <div
            className="absolute border-2 border-white"
            style={{
              left: cropData.x + 'px',
              top: cropData.y + 'px',
              width: cropData.width + 'px',
              height: cropData.height + 'px',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full -top-1.5 -left-1.5 cursor-nw-resize" />
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full -top-1.5 -right-1.5 cursor-ne-resize" />
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full -bottom-1.5 -left-1.5 cursor-sw-resize" />
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full -bottom-1.5 -right-1.5 cursor-se-resize" />

            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize" />
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize" />
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full left-1/2 -top-1.5 -translate-x-1/2 cursor-n-resize" />
            <div className="absolute w-3 h-3 bg-white border border-gray-500 rounded-full left-1/2 -bottom-1.5 -translate-x-1/2 cursor-s-resize" />
          </div>
        </>
      )}
    </div>
  );
});

export default ImageCropper;