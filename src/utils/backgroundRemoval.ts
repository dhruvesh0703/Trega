import { removeBackground } from '@imgly/background-removal';

export const removeImageBackground = async (imageSrc: string): Promise<string> => {
  try {
    // 1. Remove background using imgly, getting a transparent PNG Blob
    const config = {
      publicPath: "https://static.imgly.com/@imgly/background-removal-data/1.7.0/dist/"
    };
    const imageBlob = await removeBackground(imageSrc, config);
    
    // 2. Load the Blob into an Image object
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(imageBlob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image blob"));
      };
      image.src = url;
    });

    // 3. Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // --- PREMIUM RICH STUDIO COMPOSITING ---
    
    // 4a. Base Cyclorama Gradient (Soft Ivory to Warm Stone)
    const baseGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    baseGradient.addColorStop(0, '#fbfaf8'); // Very light ivory
    baseGradient.addColorStop(0.6, '#f3f0ea'); // Mid stone
    baseGradient.addColorStop(1, '#e6e1d8'); // Darker stone shadow
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4b. Ambient Studio Lighting (Oversized Soft Orbs)
    // Top-left soft warm glow (Brand Orange tint)
    const glow1 = ctx.createRadialGradient(
      canvas.width * 0.1, canvas.height * 0.1, 0,
      canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.6
    );
    glow1.addColorStop(0, 'rgba(234, 88, 12, 0.12)'); // brand-600 very soft
    glow1.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bottom-right soft cool pure white glow
    const glow2 = ctx.createRadialGradient(
      canvas.width * 0.9, canvas.height * 0.9, 0,
      canvas.width * 0.9, canvas.height * 0.9, canvas.width * 0.7
    );
    glow2.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    glow2.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4c. Premium Architectural Pedestal/Floor Line
    // Create a subtle horizon line to ground the product
    const horizonY = canvas.height * 0.75;
    
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(canvas.width, horizonY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Floor reflection/gradient below the horizon
    const floorGradient = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
    floorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    floorGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

    // 4d. Minimalist Grid (Only in the top background wall)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = Math.max(canvas.width, canvas.height) / 12;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, horizonY); ctx.stroke();
    }
    for (let y = 0; y <= horizonY; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // --- DRAW SUBJECT WITH PREMIUM DROP SHADOW ---
    
    // 5. Draw the transparent product with a dynamic drop shadow
    // This makes the cutout "pop" and float realistically over the pedestal
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 25;
    ctx.shadowOffsetX = 0;
    
    // Calculate scaling to ensure the product fits nicely in the "studio"
    // Leave some padding around the edges
    const padding = canvas.width * 0.1;
    const scaleX = (canvas.width - padding * 2) / img.width;
    const scaleY = (canvas.height - padding * 2) / img.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const drawX = (canvas.width - drawWidth) / 2;
    
    // Position it so the bottom of the image sits near the horizon line
    // with a slight overlap
    const drawY = horizonY - drawHeight + (drawHeight * 0.15); 

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // 6. Export as high-quality JPEG
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error("Background removal or compositing failed:", error);
    return imageSrc;
  }
};
