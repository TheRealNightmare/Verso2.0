import { useEffect } from 'react';

// Sets the browser tab title per page so users always know where they are (Rule 8).
const usePageTitle = (title) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `Verso · ${title}` : 'Verso';
    return () => {
      document.title = previous;
    };
  }, [title]);
};

export default usePageTitle;
