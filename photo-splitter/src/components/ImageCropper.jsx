import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const ImageCropper = forwardRef(({ image, onCropChange, isFollower = false }, ref) => {
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    crop: () =>
      new Promise((resolve) => {
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
          ctx.drawImage(img, scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height, 0, 0, scaledCrop.width, scaledCrop.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = image;
      }),
    getCropData: () => cropData,
    setCropData: (data) => setCropData(data),
  }));

  useEffect(() => {
    if (image && containerRef.current) {
      const img = new Image();
      img.onload = () => {
        const containerWidth = containerRef.current.clientWidth;
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

  const handleMouseDown = (e) => {
    if (isFollower) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= cropData.x && x <= cropData.x + cropData.width && y >= cropData.y && y <= cropData.y + cropData.height) {
      setIsDragging('move');
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isFollower) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    const newCropData = {
      ...cropData,
      x: Math.max(0, Math.min(imageSize.width - cropData.width, cropData.x + deltaX)),
      y: Math.max(0, Math.min(imageSize.height - cropData.height, cropData.y + deltaY)),
    };
    setCropData(newCropData);
    setDragStart({ x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={`relative border border-gray-300 rounded-lg overflow-hidden ${isFollower ? 'cursor-not-allowed' : 'cursor-move'}`}
      style={{ height: imageSize.height + 'px' }}
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
          <div className="absolute inset-0 bg-black bg-opacity-50">
            <div
              className="absolute border-2 border-white"
              style={{
                left: cropData.x + 'px',
                top: cropData.y + 'px',
                width: cropData.width + 'px',
                height: cropData.height + 'px',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
});

export default ImageCropper;