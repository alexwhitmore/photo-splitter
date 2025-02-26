export type StitchDirection = 'vertical' | 'horizontal' | 'diagonal1' | 'diagonal2' | 'circle' | 'wave';

interface ShadowEffect {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface StitchOptions {
  dividerWidth?: number;
  dividerColor?: string;
  showDivider?: boolean;
  quality?: number;
  labels?: [string, string];
  labelColor?: string;
}

/**
 * Stitches two images together using the specified direction and options
 * @param image1Src - Source of the first image
 * @param image2Src - Source of the second image
 * @param direction - How the images should be stitched together
 * @param options - Additional configuration options
 * @returns Promise resolving to the data URL of the stitched image
 */
export function stitchImages(
  image1Src: string, 
  image2Src: string, 
  direction: StitchDirection, 
  options: StitchOptions = {}
): Promise<string> {
  return new Promise((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    let loadedCount = 0;
    
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Failed to get canvas 2D context');
          resolve('');
          return;
        }
        
        const width = img1.width;
        const height = img1.height;
        
        if (img1.width !== img2.width || img1.height !== img2.height) {
          console.warn('Images have different dimensions. Resizing second image to match first.');
        }
        
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img1, 0, 0, width, height);
        ctx.save();
        ctx.beginPath();
        
        const dividerWidth = options.dividerWidth || 2;
        const dividerColor = options.dividerColor || '#ffffff';
        
        switch (direction) {
          case 'vertical':
            ctx.rect(width / 2, 0, width / 2, height);
            break;
          case 'horizontal':
            ctx.rect(0, height / 2, width, height / 2);
            break;
          case 'diagonal1':
            ctx.moveTo(0, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(width, 0);
            ctx.closePath();
            break;
          case 'diagonal2':
            ctx.moveTo(0, height);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height);
            ctx.closePath();
            break;
          case 'circle': {
            const radius = Math.min(width, height) * 0.4;
            ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
            break;
          }
          case 'wave':
            ctx.moveTo(0, height / 2);
            for (let x = 0; x < width; x += 20) {
              ctx.quadraticCurveTo(
                x + 10, height / 2 + 20, 
                x + 20, height / 2
              );
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            break;
          default:
            ctx.rect(width / 2, 0, width / 2, height);
        }

        ctx.clip();
        ctx.drawImage(img2, 0, 0, width, height);
        ctx.restore();

        if (options.showDivider !== false) {
          ctx.strokeStyle = dividerColor;
          ctx.lineWidth = dividerWidth;
          
          ctx.beginPath();
          switch (direction) {
            case 'vertical':
              ctx.moveTo(width / 2, 0);
              ctx.lineTo(width / 2, height);
              break;
            case 'horizontal':
              ctx.moveTo(0, height / 2);
              ctx.lineTo(width, height / 2);
              break;
            case 'diagonal1':
              ctx.moveTo(0, 0);
              ctx.lineTo(width, height);
              break;
            case 'diagonal2':
              ctx.moveTo(0, height);
              ctx.lineTo(width, 0);
              break;
            case 'circle': {
              const radius = Math.min(width, height) * 0.4;
              ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
              break;
            }
            case 'wave':
              ctx.moveTo(0, height / 2);
              for (let x = 0; x < width; x += 20) {
                ctx.quadraticCurveTo(
                  x + 10, height / 2 + 20, 
                  x + 20, height / 2
                );
              }
              break;
          }
          ctx.stroke();
        }
        
        if (options.labels) {
          ctx.font = '16px Arial';
          ctx.fillStyle = options.labelColor || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const padding = 20;
          const shadow: ShadowEffect = {
            offsetX: 1,
            offsetY: 1,
            blur: 3,
            color: 'rgba(0,0,0,0.7)'
          };

          ctx.shadowOffsetX = shadow.offsetX;
          ctx.shadowOffsetY = shadow.offsetY;
          ctx.shadowBlur = shadow.blur;
          ctx.shadowColor = shadow.color;
          
          switch (direction) {
            case 'vertical':
              ctx.fillText(options.labels[0] || 'Light', width / 4, padding);
              ctx.fillText(options.labels[1] || 'Dark', 3 * width / 4, padding);
              break;
            case 'horizontal':
              ctx.fillText(options.labels[0] || 'Light', padding * 3, height / 4);
              ctx.fillText(options.labels[1] || 'Dark', padding * 3, 3 * height / 4);
              break;
            default:
              break;
          }
          
          ctx.shadowColor = 'transparent';
        }
        
        resolve(canvas.toDataURL('image/png', options.quality || 1.0));
      }
    };
    
    img1.onload = onLoad;
    img2.onload = onLoad;
    img1.src = image1Src;
    img2.src = image2Src;
  });
}