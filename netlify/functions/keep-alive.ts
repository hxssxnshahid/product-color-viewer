
import { createClient } from '@supabase/supabase-js';

interface Event {
    httpMethod: string;
}

/**
 * Keep-alive function for Supabase database
 * Runs on a schedule to prevent the database from pausing due to inactivity
 * Executes every Monday, Wednesday, and Friday at 9:00 AM UTC
 */
export const handler = async (event: Event) => {
    // Only allow POST requests from Netlify scheduled functions
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Missing Supabase configuration',
                timestamp: new Date().toISOString()
            })
        };
    }

    try {
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Perform a lightweight query to keep the database active
        // Using COUNT on articles table - lightweight but ensures connection
        const { data, error, count } = await supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .limit(1);

        if (error) {
            console.error('Keep-alive query failed:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Database query failed',
                    details: error.message,
                    timestamp: new Date().toISOString()
                })
            };
        }

        console.log('Keep-alive successful:', {
            count: count || 0,
            timestamp: new Date().toISOString()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Database keep-alive successful',
                articleCount: count || 0,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Unexpected error in keep-alive function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Unexpected error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            })
        };
    }
};

