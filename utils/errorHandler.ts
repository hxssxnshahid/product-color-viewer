export interface AppError {
    message: string;
    code?: string;
    retryable?: boolean;
    details?: any;
}

export class ErrorHandler {
    static handleSupabaseError(error: any): AppError {
        if (error.code === 'PGRST116') {
            return {
                message: 'No data found. Please check your search criteria.',
                code: 'NO_DATA',
                retryable: false
            };
        }
        
        if (error.code === '23505') {
            return {
                message: 'This article number already exists.',
                code: 'DUPLICATE',
                retryable: false
            };
        }
        
        if (error.message?.includes('network')) {
            return {
                message: 'Network error. Please check your connection and try again.',
                code: 'NETWORK',
                retryable: true
            };
        }
        
        return {
            message: error.message || 'An unexpected error occurred.',
            code: 'UNKNOWN',
            retryable: true,
            details: error
        };
    }
    
    static getErrorMessage(error: AppError): string {
        return error.message;
    }
    
    static shouldRetry(error: AppError): boolean {
        return error.retryable || false;
    }
}
