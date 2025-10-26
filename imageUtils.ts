[1mdiff --git a/utils/imageUtils.ts b/utils/imageUtils.ts[m
[1mindex f85d765..e69de29 100644[m
[1m--- a/utils/imageUtils.ts[m
[1m+++ b/utils/imageUtils.ts[m
[36m@@ -1,140 +0,0 @@[m
[31m-export interface ImageCompressionOptions {[m
[31m-    maxWidth?: number;[m
[31m-    maxHeight?: number;[m
[31m-    quality?: number;[m
[31m-    maxSizeKB?: number;[m
[31m-}[m
[31m-[m
[31m-export class ImageUtils {[m
[31m-    static async compressImage([m
[31m-        file: File, [m
[31m-        options: ImageCompressionOptions = {}[m
[31m-    ): Promise<File> {[m
[31m-        const {[m
[31m-            maxWidth = 2500,[m
[31m-            maxHeight = 2500,[m
[31m-            quality = 0.92,[m
[31m-            maxSizeKB = 500[m
[31m-        } = options;[m
[31m-[m
[31m-        return new Promise((resolve, reject) => {[m
[31m-            const canvas = document.createElement('canvas');[m
[31m-            const ctx = canvas.getContext('2d');[m
[31m-            const img = new Image();[m
[31m-            const fileUrl = URL.createObjectURL(file);[m
[31m-[m
[31m-            img.onload = () => {[m
[31m-                try {[m
[31m-                    // Calculate new dimensions[m
[31m-                    let { width, height } = img;[m
[31m-                    [m
[31m-                    if (width > height) {[m
[31m-                        if (width > maxWidth) {[m
[31m-                            height = (height * maxWidth) / width;[m
[31m-                            width = maxWidth;[m
[31m-                        }[m
[31m-                    } else {[m
[31m-                        if (height > maxHeight) {[m
[31m-                            width = (width * maxHeight) / height;[m
[31m-                            height = maxHeight;[m
[31m-                        }[m
[31m-                    }[m
[31m-[m
[31m-                    canvas.width = width;[m
[31m-                    canvas.height = height;[m
[31m-[m
[31m-                    // Draw and compress[m
[31m-                    if (!ctx) {[m
[31m-                        URL.revokeObjectURL(fileUrl);[m
[31m-                        reject(new Error('Failed to get canvas context'));[m
[31m-                        return;[m
[31m-                    }[m
[31m-[m
[31m-                    ctx.drawImage(img, 0, 0, width, height);[m
[31m-                    [m
[31m-                    canvas.toBlob([m
[31m-                        (blob) => {[m
[31m-                            URL.revokeObjectURL(fileUrl);[m
[31m-                            [m
[31m-                            if (!blob) {[m
[31m-                                reject(new Error('Failed to compress image'));[m
[31m-                                return;[m
[31m-                            }[m
[31m-[m
[31m-                            // Check file size[m
[31m-                            const sizeKB = blob.size / 1024;[m
[31m-                            if (sizeKB > maxSizeKB) {[m
[31m-                                // Recursively compress with slightly lower quality (5% reduction per iteration)[m
[31m-                                const newQuality = Math.max(quality - 0.05, 0.3);[m
[31m-                                if (newQuality >= 0.3) {[m
[31m-                                    this.compressImage(file, { ...options, quality: newQuality })[m
[31m-                                        .then(resolve)[m
[31m-                                        .catch(reject);[m
[31m-                                } else {[m
[31m-                                    reject(new Error('Image too large to compress while maintaining quality'));[m
[31m-                                }[m
[31m-                            } else {[m
[31m-                                const compressedFile = new File([blob], file.name, {[m
[31m-                                    type: 'image/jpeg',[m
[31m-                                    lastModified: Date.now()[m
[31m-                                });[m
[31m-                                resolve(compressedFile);[m
[31m-                            }[m
[31m-                        },[m
[31m-                        'image/jpeg',[m
[31m-                        quality[m
[31m-                    );[m
[31m-                } catch (error) {[m
[31m-                    URL.revokeObjectURL(fileUrl);[m
[31m-                    reject(error instanceof Error ? error : new Error('Failed to process image'));[m
[31m-                }[m
[31m-            };[m
[31m-[m
[31m-            img.onerror = (error) => {[m
[31m-                URL.revokeObjectURL(fileUrl);[m
[31m-                reject(new Error('Failed to load image. Please select a valid image file.'));[m
[31m-            };[m
[31m-            [m
[31m-            img.src = fileUrl;[m
[31m-        });[m
[31m-    }[m
[31m-[m
[31m-    static validateImageFile(file: File): { valid: boolean; error?: string } {[m
[31m-        const validTypes = [[m
[31m-            'image/jpeg', [m
[31m-            'image/jpg', [m
[31m-            'image/png', [m
[31m-            'image/webp',[m
[31m-            'image/heic',[m
[31m-            'image/heif',[m
[31m-            'image/avif'[m
[31m-        ];[m
[31m-        const maxSize = 10 * 1024 * 1024; // 10MB[m
[31m-[m
[31m-        // iOS sometimes doesn't provide proper MIME type, so also check file extension[m
[31m-        const fileName = file.name.toLowerCase();[m
[31m-        const hasValidExtension = fileName.endsWith('.jpg') || [m
[31m-                                  fileName.endsWith('.jpeg') || [m
[31m-                                  fileName.endsWith('.png') || [m
[31m-                                  fileName.endsWith('.webp') ||[m
[31m-                                  fileName.endsWith('.heic') ||[m
[31m-                                  fileName.endsWith('.heif') ||[m
[31m-                                  fileName.endsWith('.avif');[m
[31m-[m
[31m-        if (!validTypes.includes(file.type) && !hasValidExtension && file.type !== '') {[m
[31m-            return {[m
[31m-                valid: false,[m
[31m-                error: 'Please select a valid image file (JPEG, PNG, WebP, HEIC, or HEIF)'[m
[31m-            };[m
[31m-        }[m
[31m-[m
[31m-        if (file.size > maxSize) {[m
[31m-            return {[m
[31m-                valid: false,[m
[31m-                error: 'Image file is too large. Maximum size is 10MB'[m
[31m-            };[m
[31m-        }[m
[31m-[m
[31m-        return { valid: true };[m
[31m-    }[m
[31m-}[m
