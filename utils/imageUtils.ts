// @ts-ignore - No type definitions available
import heic2any from 'heic2any';
// @ts-ignore - No type definitions available
import imageCompression from 'browser-image-compression';

interface ConvertAndCompressOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
    try {
        const isHeic = /\.(heic|heif)$/i.test(file.name);
        
        if (isHeic) {
            const convertedBlobs = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            
            const blob = Array.isArray(convertedBlobs) ? convertedBlobs[0] : convertedBlobs;
            return blob as Blob;
        }
        
        return file;
    } catch (error) {
        console.error('Error converting HEIC:', error);
        throw new Error('Failed to convert HEIC image. Please try a different format.');
    }
}

export async function compressImage(
    file: File,
    options: ConvertAndCompressOptions = {}
): Promise<File> {
    const {
        maxSizeMB = 2,
        maxWidthOrHeight = 1920,
        useWebWorker = true
    } = options;

    try {
        const compressionOptions = {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker,
            fileType: 'image/jpeg',
            initialQuality: 0.8
        };

        const compressedFile = await imageCompression(file, compressionOptions);
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        throw new Error('Failed to compress image.');
    }
}

export async function processImage(
    file: File,
    options: ConvertAndCompressOptions = {}
): Promise<File> {
    try {
        let processedBlob = await convertHeicToJpeg(file);
        
        let processedFile = file;
        if (file.type !== processedBlob.type) {
            processedFile = new File(
                [processedBlob],
                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                { type: 'image/jpeg' }
            );
        }
        
        const compressedFile = await compressImage(processedFile, options);
        
        return compressedFile;
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}

export function validateImageFile(file: File): boolean {
    const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
    ];
    
    return validTypes.includes(file.type);
}

export function getFileSizeMB(file: File): number {
    return file.size / (1024 * 1024);
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

