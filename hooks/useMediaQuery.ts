/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        // Initialize with current match state
        return window.matchMedia(query).matches;
    });
    
    useEffect(() => {
        const media = window.matchMedia(query);
        
        // Update if initial state doesn't match current state
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        
        // Use the media query's change event instead of window resize
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        
        // Modern browsers support addEventListener on MediaQueryList
        media.addEventListener('change', listener);
        
        return () => media.removeEventListener('change', listener);
    }, [query]); // Only re-run when query changes, not when matches changes
    
    return matches;
}

