export interface FigmaConfig {
  apiBaseUrl: string;
  timeout: number;
  rateLimitDelay: number; // Delay between requests to avoid rate limits
}

export const figmaConfig: FigmaConfig = {
  apiBaseUrl: process.env.FIGMA_API_BASE_URL || 'https://api.figma.com/v1',
  timeout: 30000,
  rateLimitDelay: 200, // 200ms delay between requests
};



