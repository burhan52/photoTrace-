import { ImageClientMetadata } from '../types';

/**
 * Calculates SHA-256 hash of a file or blob using Web Crypto API
 */
export async function calculateSha256(fileOrBlob: Blob): Promise<string> {
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('SHA-256 calculation failed:', err);
    return 'Unavailable';
  }
}

/**
 * Formats bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extracts dominant colors using an HTML5 Canvas
 */
export async function extractDominantColors(imageSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(['#0f172a', '#1e293b', '#334155']);

        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        const colorBuckets: { [hex: string]: number } = {};

        for (let i = 0; i < imageData.length; i += 16) {
          const r = Math.round(imageData[i] / 32) * 32;
          const g = Math.round(imageData[i + 1] / 32) * 32;
          const b = Math.round(imageData[i + 2] / 32) * 32;
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
        }

        const sortedColors = Object.entries(colorBuckets)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([hex]) => hex);

        resolve(sortedColors.length ? sortedColors : ['#0f172a', '#38bdf8', '#64748b']);
      } catch {
        resolve(['#0f172a', '#38bdf8', '#64748b']);
      }
    };
    img.onerror = () => resolve(['#0f172a', '#38bdf8', '#64748b']);
    img.src = imageSrc;
  });
}

/**
 * Inspects JPEG EXIF tags without external dependencies
 */
export async function parseJpegExif(file: Blob): Promise<ImageClientMetadata['exif']> {
  try {
    const buffer = await file.slice(0, 131072).arrayBuffer(); // read first 128KB
    const view = new DataView(buffer);

    if (view.getUint16(0, false) !== 0xffd8) {
      return undefined; // Not a JPEG
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);

      if (marker === 0xe1) {
        // APP1 (EXIF marker)
        const app1Length = view.getUint16(offset + 2, false);
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );

        if (exifHeader === 'Exif') {
          const tiffStart = offset + 10;
          const isLittleEndian = view.getUint16(tiffStart, false) === 0x4949;

          const readUint16 = (o: number) => view.getUint16(o, isLittleEndian);
          const readUint32 = (o: number) => view.getUint32(o, isLittleEndian);

          const ifd0Offset = readUint32(tiffStart + 4);
          const numEntries = readUint16(tiffStart + ifd0Offset);

          const exifData: ImageClientMetadata['exif'] = {};

          for (let i = 0; i < numEntries; i++) {
            const entryOffset = tiffStart + ifd0Offset + 2 + i * 12;
            if (entryOffset + 12 > length) break;
            const tag = readUint16(entryOffset);
            const valOffset = readUint32(entryOffset + 8);

            // Tag 0x010F: Camera Make
            if (tag === 0x010f) {
              exifData.cameraMake = readString(view, tiffStart + valOffset, 32);
            }
            // Tag 0x0110: Camera Model
            if (tag === 0x0110) {
              exifData.cameraModel = readString(view, tiffStart + valOffset, 32);
            }
            // Tag 0x0132: Date Time
            if (tag === 0x0132) {
              exifData.dateTimeOriginal = readString(view, tiffStart + valOffset, 20);
            }
            // Tag 0x0131: Software
            if (tag === 0x0131) {
              exifData.software = readString(view, tiffStart + valOffset, 32);
            }
          }

          return Object.keys(exifData).length ? exifData : undefined;
        }
        offset += 2 + app1Length;
      } else if (marker === 0xda) {
        // Start of Scan
        break;
      } else {
        const markerLength = view.getUint16(offset + 2, false);
        offset += 2 + markerLength;
      }
    }
  } catch (err) {
    console.warn('EXIF parsing skipped:', err);
  }
  return undefined;
}

function readString(view: DataView, offset: number, maxLen: number): string {
  let str = '';
  for (let i = 0; i < maxLen; i++) {
    if (offset + i >= view.byteLength) break;
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

/**
 * Builds complete client-side metadata for an uploaded image
 */
export async function buildImageMetadata(file: File, imageSrc: string): Promise<ImageClientMetadata> {
  const [sha256, dominantColors, exif] = await Promise.all([
    calculateSha256(file),
    extractDominantColors(imageSrc),
    parseJpegExif(file),
  ]);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 800;
      const height = img.naturalHeight || 600;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const aspect = `${width / divisor}:${height / divisor}`;

      resolve({
        fileName: file.name,
        fileSizeFormatted: formatBytes(file.size),
        width,
        height,
        aspectRatio: aspect.length < 8 ? aspect : `${(width / height).toFixed(2)}:1`,
        mimeType: file.type || 'image/jpeg',
        sha256,
        dominantColors,
        exif,
      });
    };
    img.onerror = () => {
      resolve({
        fileName: file.name,
        fileSizeFormatted: formatBytes(file.size),
        width: 0,
        height: 0,
        aspectRatio: '1:1',
        mimeType: file.type || 'image/jpeg',
        sha256,
        dominantColors,
        exif,
      });
    };
    img.src = imageSrc;
  });
}
