const STACK_LINES = 5;

export function formatError(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack?.split("\n").slice(0, STACK_LINES).join("\n"),
    };
  }
  return { message: String(error) };
}
