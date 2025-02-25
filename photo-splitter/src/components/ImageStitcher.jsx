export function stitchImages(image1Src, image2Src, direction) {
    return new Promise((resolve) => {
      const img1 = new Image();
      const img2 = new Image();
      let loadedCount = 0;
  
      const onLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img1.width;
          canvas.height = img1.height;
  
          ctx.drawImage(img1, 0, 0);
          ctx.save();
          ctx.beginPath();
  
          if (direction === 'vertical') {
            ctx.rect(img1.width / 2, 0, img1.width / 2, img1.height);
          } else if (direction === 'horizontal') {
            ctx.rect(0, img1.height / 2, img1.width, img1.height / 2);
          } else if (direction === 'diagonal1') {
            ctx.moveTo(0, 0);
            ctx.lineTo(img1.width, img1.height);
            ctx.lineTo(img1.width, 0);
            ctx.closePath();
          } else if (direction === 'diagonal2') {
            ctx.moveTo(0, img1.height);
            ctx.lineTo(img1.width, 0);
            ctx.lineTo(img1.width, img1.height);
            ctx.closePath();
          }
  
          ctx.clip();
          ctx.drawImage(img2, 0, 0);
          ctx.restore();
  
          // Removed the border-drawing code below
          /*
          ctx.save();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (direction === 'vertical') {
            ctx.moveTo(img1.width / 2, 0);
            ctx.lineTo(img1.width / 2, img1.height);
          } else if (direction === 'horizontal') {
            ctx.moveTo(0, img1.height / 2);
            ctx.lineTo(img1.width, img1.height / 2);
          } else if (direction === 'diagonal1') {
            ctx.moveTo(0, 0);
            ctx.lineTo(img1.width, img1.height);
          } else if (direction === 'diagonal2') {
            ctx.moveTo(0, img1.height);
            ctx.lineTo(img1.width, 0);
          }
          ctx.stroke();
          ctx.restore();
          */
  
          resolve(canvas.toDataURL('image/png'));
        }
      };
  
      img1.onload = onLoad;
      img2.onload = onLoad;
      img1.src = image1Src;
      img2.src = image2Src;
    });
  }