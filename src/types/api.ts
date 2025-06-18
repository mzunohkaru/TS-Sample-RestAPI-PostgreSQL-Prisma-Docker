import { User } from "@prisma/client";

// Base API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    validation?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
    duration?: number;
    [key: string]: any;
  };
}

// Pagination interface
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated API response
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// User-related types
export type PublicUser = Omit<User, "password">;

export interface UserWithPosts extends PublicUser {
  posts: {
    id: number;
    title: string;
    content?: string;
    createdAt: Date;
    updatedAt?: Date;
  }[];
}

// Request/Response types for each endpoint

// GET /users
export interface GetUsersRequest {
  query: {
    page?: string;
    limit?: string;
    search?: string;
    sortBy?: "name" | "email" | "createdAt";
    sortOrder?: "asc" | "desc";
  };
}

export interface GetUsersResponse extends PaginatedApiResponse<UserWithPosts> {}

// GET /users/:id
export interface GetUserByIdRequest {
  params: {
    id: string;
  };
}

export interface GetUserByIdResponse extends ApiResponse<UserWithPosts> {}

// POST /users/register
export interface CreateUserRequest {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface CreateUserResponse extends ApiResponse<PublicUser> {}

// PUT /users/:id
export interface UpdateUserRequest {
  params: {
    id: string;
  };
  body: {
    name?: string;
    email?: string;
    password?: string;
  };
}

export interface UpdateUserResponse extends ApiResponse<PublicUser> {
  meta: ApiResponse["meta"] & {
    updatedFields: string[];
  };
}

// DELETE /users/:id
export interface DeleteUserRequest {
  params: {
    id: string;
  };
}

export interface DeleteUserResponse
  extends ApiResponse<{
    id: string;
    email: string;
    deletedAt: string;
  }> {}

// POST /users/:id (upsert)
export interface UpsertUserRequest {
  params: {
    id: string;
  };
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface UpsertUserResponse extends ApiResponse<PublicUser> {
  meta: ApiResponse["meta"] & {
    operation: "created" | "updated";
  };
}

// Error response types
export interface ValidationErrorDetails {
  [field: string]: string[];
}

export interface DatabaseErrorDetails {
  fields?: string[];
  constraint?: string;
  code?: string;
  meta?: any;
}

// Health check types
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: {
    seconds: number;
    human: string;
  };
  memory: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
    external: string;
  };
  activeRequests: number;
  nodeVersion: string;
  pid: number;
}

// Metrics types
export interface MetricsResponse {
  timestamp: number;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  activeRequests: number;
  requests: {
    active: {
      requestId: string;
      method: string;
      url: string;
      duration: number;
      ip: string;
    }[];
  };
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Request context types (for middleware)
export interface RequestContext {
  requestId: string;
  startTime: number;
  user?: AuthUser;
  rateLimitInfo?: RateLimitInfo;
  performanceMarkers?: {
    requestStart: number;
    middlewareEnd: number;
    controllerEnd: number;
    responseEnd: number;
  };
  initialMemory?: NodeJS.MemoryUsage;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}
