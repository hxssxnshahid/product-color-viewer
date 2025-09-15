import React from 'react';

export const accessibilityUtils = {
    // Generate unique IDs for form elements
    generateId: (prefix: string): string => {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // ARIA labels for common actions
    getAriaLabels: {
        search: (query: string) => 
            query ? `Search results for "${query}"` : 'Search articles',
        
        delete: (item: string) => `Delete ${item}`,
        
        upload: () => 'Upload new color image',
        
        close: () => 'Close modal',
        
        select: (item: string) => `Select ${item}`
    },

    // Keyboard navigation helpers
    handleKeyDown: {
        escape: (callback: () => void) => (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                callback();
            }
        },
        
        enter: (callback: () => void) => (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                callback();
            }
        },
        
        arrowKeys: (callback: (direction: 'up' | 'down') => void) => (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                callback('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                callback('down');
            }
        }
    },

    // Focus management
    focus: {
        trap: (containerRef: React.RefObject<HTMLElement>) => {
            const focusableElements = containerRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements && focusableElements.length > 0) {
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
                
                return (e: KeyboardEvent) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                lastElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                firstElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                };
            }
            
            return () => {};
        }
    }
};
