/**
 * Petits utilitaires de pagination utilisés par les endpoints de listing.
 */
export interface PageOptions {
  page: number;
  limit: number;
}

export function parsePage(query: { page?: string | number; limit?: string | number }): PageOptions {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  return { page, limit };
}

export function pageResult<T>(items: T[], total: number, { page, limit }: PageOptions) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
