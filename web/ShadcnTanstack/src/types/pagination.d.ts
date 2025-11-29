export {};

declare global {
  interface PaginationData {
    PAGE_COUNT: number;
    DEFAULT_PAGE_SIZE: number;
    PAGE_SIZES: number[];
    DEFAULT_PAGE: number;
  }

  interface PageOptions {
    page: number;
    pageSize: number;
    orderBy?: KeyPair<string>[];
  }

  interface Pagination {
    page: number;
    pageCount: number;
    pageSize: number;
    totalRecords: number;
    orderBy?: KeyPair<string>[];
  }
}
