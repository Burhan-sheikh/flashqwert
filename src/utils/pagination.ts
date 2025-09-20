// 
// Enhanced pagination utility function
export function generatePaginationPages(currentPage: number, totalPages: number, isMobile = false) {
  if (totalPages <= 1) {
    return [];
  }

  if (isMobile) {
    return { currentPage, totalPages };
  }

  const maxVisible = 7;
  const pages: (number | string)[] = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);

  const halfVisible = Math.floor((maxVisible - 2) / 2);
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  if (currentPage <= halfVisible + 1) {
    end = Math.min(maxVisible - 1, totalPages - 1);
  }

  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 2);
  }

  if (start > 2) {
    pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages.filter((page, index, arr) => {
    return index === 0 || page !== arr[index - 1];
  });
}
