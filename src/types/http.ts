// Shared HTTP/API error shapes used across UI pages
export interface HttpError extends Error {
  status?: number;
  body?: string;
}

export type ApiError = {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
};
