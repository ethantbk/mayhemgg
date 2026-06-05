type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type DatabaseResult<T> =
  | { data: T; error: null }
  | { data: null; error: DatabaseError };

export class DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(message: string, options?: { code?: string; details?: string; hint?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "DatabaseError";
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
  }
}

function isSupabaseErrorLike(error: unknown): error is SupabaseErrorLike {
  return Boolean(error && typeof error === "object" && "message" in error);
}

export function toDatabaseError(error: unknown, context = "Database request failed") {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (isSupabaseErrorLike(error)) {
    return new DatabaseError(`${context}: ${error.message ?? "Unknown Supabase error"}`, {
      code: error.code,
      details: error.details,
      hint: error.hint,
      cause: error
    });
  }

  if (error instanceof Error) {
    return new DatabaseError(`${context}: ${error.message}`, { cause: error });
  }

  return new DatabaseError(context, { cause: error });
}

export function unwrapSupabaseResponse<T>(
  response: { data: T | null; error: unknown },
  context?: string
): T {
  if (response.error) {
    throw toDatabaseError(response.error, context);
  }

  if (response.data === null) {
    throw new DatabaseError(context ? `${context}: No data returned.` : "Database request returned no data.");
  }

  return response.data;
}

export async function safeSupabaseQuery<T>(
  query: PromiseLike<{ data: T | null; error: unknown }>,
  context?: string
): Promise<DatabaseResult<T>> {
  try {
    return {
      data: unwrapSupabaseResponse(await query, context),
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: toDatabaseError(error, context)
    };
  }
}
