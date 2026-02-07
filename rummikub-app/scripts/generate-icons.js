// Script para generar iconos PNG desde SVG
// Requiere: npm install sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generando iconos desde SVG...');
  
  for (const size of sizes) {
    try {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Error generando ${size}x${size}:`, error.message);
    }
  }
  
  // Generar favicons específicos
  try {
    await sharp(inputSvg)
      .resize(16, 16)
      .png()
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    console.log('✓ Generado: favicon-16x16.png');
    
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    console.log('✓ Generado: favicon-32x32.png');
    
    await sharp(inputSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ Generado: apple-touch-icon.png');
    
    await sharp(inputSvg)
      .resize(150, 150)
      .png()
      .toFile(path.join(outputDir, 'mstile-150x150.png'));
    console.log('✓ Generado: mstile-150x150.png');
    
    await sharp(inputSvg)
      .resize(72, 72)
      .png()
      .toFile(path.join(outputDir, 'badge-72x72.png'));
    console.log('✓ Generado: badge-72x72.png');
  } catch (error) {
    console.error('✗ Error generando favicons:', error.message);
  }
  
  console.log('\n✅ Todos los iconos generados exitosamente!');
}

generateIcons().catch(console.error);
