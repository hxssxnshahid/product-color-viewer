import { useState, useEffect, useMemo } from 'react';
import type { Article } from '../types';

interface UseSearchResult {
    searchQuery: string;
    filteredArticles: Article[];
    handleSearch: (query: string) => void;
}

export const useSearch = (articles: Article[]): UseSearchResult => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredArticles, setFilteredArticles] = useState<Article[]>(articles);

    // Update filtered articles when articles prop changes
    useEffect(() => {
        setFilteredArticles(articles);
    }, [articles]);

    // Enhanced search function with fuzzy search and partial matching
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredArticles(articles);
        } else {
            const lowerCaseQuery = query.toLowerCase().trim();
            
            setFilteredArticles(
                articles.filter(article => {
                    const articleNumber = article.article_number.toLowerCase();
                    const articleName = article.name?.toLowerCase() || '';
                    
                    // Exact match (highest priority)
                    if (articleNumber === lowerCaseQuery) {
                        return true;
                    }
                    
                    // Starts with query (high priority)
                    if (articleNumber.startsWith(lowerCaseQuery)) {
                        return true;
                    }
                    
                    // Contains query (medium priority)
                    if (articleNumber.includes(lowerCaseQuery)) {
                        return true;
                    }
                    
                    // Fuzzy search - check if all characters in query exist in article number
                    const queryChars = lowerCaseQuery.split('');
                    const articleChars = articleNumber.split('');
                    
                    let queryIndex = 0;
                    for (let i = 0; i < articleChars.length && queryIndex < queryChars.length; i++) {
                        if (articleChars[i] === queryChars[queryIndex]) {
                            queryIndex++;
                        }
                    }
                    
                    // If all query characters were found in order, it's a fuzzy match
                    if (queryIndex === queryChars.length) {
                        return true;
                    }
                    
                    // Search in article name if it exists
                    if (articleName && articleName.includes(lowerCaseQuery)) {
                        return true;
                    }
                    
                    return false;
                }).sort((a, b) => {
                    const aNumber = a.article_number.toLowerCase();
                    const bNumber = b.article_number.toLowerCase();
                    
                    // Sort by relevance: exact match > starts with > contains > fuzzy match
                    const aExact = aNumber === lowerCaseQuery;
                    const bExact = bNumber === lowerCaseQuery;
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    
                    const aStartsWith = aNumber.startsWith(lowerCaseQuery);
                    const bStartsWith = bNumber.startsWith(lowerCaseQuery);
                    if (aStartsWith && !bStartsWith) return -1;
                    if (!aStartsWith && bStartsWith) return 1;
                    
                    const aContains = aNumber.includes(lowerCaseQuery);
                    const bContains = bNumber.includes(lowerCaseQuery);
                    if (aContains && !bContains) return -1;
                    if (!aContains && bContains) return 1;
                    
                    // If same relevance, sort alphabetically
                    return aNumber.localeCompare(bNumber);
                })
            );
        }
    };

    return {
        searchQuery,
        filteredArticles,
        handleSearch
    };
};
