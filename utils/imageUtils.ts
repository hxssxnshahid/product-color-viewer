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
            maxWidth = 800,
            maxHeight = 600,
            quality = 0.8,
            maxSizeKB = 500
        } = options;

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
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
                ctx?.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Check file size
                        const sizeKB = blob.size / 1024;
                        if (sizeKB > maxSizeKB) {
                            // Recursively compress with lower quality
                            const newQuality = quality * 0.8;
                            if (newQuality > 0.1) {
                                this.compressImage(file, { ...options, quality: newQuality })
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                reject(new Error('Image too large to compress'));
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
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    static validateImageFile(file: File): { valid: boolean; error?: string } {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Please select a valid image file (JPEG, PNG, or WebP)'
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
