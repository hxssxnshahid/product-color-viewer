export interface ImageCompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
}

export class ImageUtils {
    static async compressImage(
        file: File, 
        options: ImageCompressionOptions = {}
    ): Promise<File> {
        const {
            maxWidth = 2500,
            maxHeight = 2500,
            quality = 0.92,
            maxSizeKB = 500
        } = options;

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const fileUrl = URL.createObjectURL(file);

            img.onload = () => {
                try {
                    // Calculate new dimensions
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    if (!ctx) {
                        URL.revokeObjectURL(fileUrl);
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            URL.revokeObjectURL(fileUrl);
                            
                            if (!blob) {
                                reject(new Error('Failed to compress image'));
                                return;
                            }

                            // Check file size
                            const sizeKB = blob.size / 1024;
                            if (sizeKB > maxSizeKB) {
                                // Recursively compress with slightly lower quality (5% reduction per iteration)
                                const newQuality = Math.max(quality - 0.05, 0.3);
                                if (newQuality >= 0.3) {
                                    this.compressImage(file, { ...options, quality: newQuality })
                                        .then(resolve)
                                        .catch(reject);
                                } else {
                                    reject(new Error('Image too large to compress while maintaining quality'));
                                }
                            } else {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                } catch (error) {
                    URL.revokeObjectURL(fileUrl);
                    reject(error instanceof Error ? error : new Error('Failed to process image'));
                }
            };

            img.onerror = (error) => {
                URL.revokeObjectURL(fileUrl);
                reject(new Error('Failed to load image. Please select a valid image file.'));
            };
            
            img.src = fileUrl;
        });
    }

    static validateImageFile(file: File): { valid: boolean; error?: string } {
        const validTypes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/webp',
            'image/heic',
            'image/heif',
            'image/avif'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        // iOS sometimes doesn't provide proper MIME type, so also check file extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = fileName.endsWith('.jpg') || 
                                  fileName.endsWith('.jpeg') || 
                                  fileName.endsWith('.png') || 
                                  fileName.endsWith('.webp') ||
                                  fileName.endsWith('.heic') ||
                                  fileName.endsWith('.heif') ||
                                  fileName.endsWith('.avif');

        if (!validTypes.includes(file.type) && !hasValidExtension && file.type !== '') {
            return {
                valid: false,
                error: 'Please select a valid image file (JPEG, PNG, WebP, HEIC, or HEIF)'
            };
        }

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'Image file is too large. Maximum size is 10MB'
            };
        }

        return { valid: true };
    }
}
