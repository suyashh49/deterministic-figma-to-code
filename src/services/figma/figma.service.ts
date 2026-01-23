import { HttpClient } from '../../utils/http';
import { figmaConfig } from '../../config/figma.config';
import { FigmaApiError, RateLimitError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, unknown>;
  componentSets: Record<string, unknown>;
  styles: Record<string, unknown>;
  schemaVersion: number;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  [key: string]: unknown;
}

export interface FigmaNodeResponse {
  nodes: Record<string, {
    document: FigmaNode;
    components: Record<string, unknown>;
    componentSets: Record<string, unknown>;
    styles: Record<string, unknown>;
  }>;
}

export class FigmaService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(figmaConfig.apiBaseUrl);
  }

  private extractRetryAfter(headers: Record<string, unknown>): number | undefined {
    const retryAfter = headers['retry-after'] || headers['Retry-After'];
    if (typeof retryAfter === 'string') {
      return parseInt(retryAfter, 10);
    }
    if (typeof retryAfter === 'number') {
      return retryAfter;
    }
    return undefined;
  }

  async getFile(fileKey: string, accessToken: string): Promise<FigmaFileResponse> {
    try {
      logger.debug('Fetching Figma file', { fileKey });
      
      const response = await this.httpClient.get<FigmaFileResponse>(
        `/files/${fileKey}`,
        {
          headers: {
            'X-Figma-Token': accessToken,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          status: number; 
          headers?: Record<string, unknown>;
          data?: unknown;
        } 
      };
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        if (status === 429) {
          const retryAfter = this.extractRetryAfter(axiosError.response.headers || {});
          logger.error('Figma API rate limit exceeded (429)', { fileKey, retryAfter });
          throw new RateLimitError(
            `Figma API rate limit exceeded. Please retry after ${retryAfter || 'some time'} seconds`,
            retryAfter
          );
        }
        
        const message = `Figma API error: ${status}`;
        logger.error(message, error, { fileKey, status });
        throw new FigmaApiError(message, status);
      }

      logger.error('Failed to fetch Figma file', error, { fileKey });
      throw new FigmaApiError('Failed to fetch Figma file', 500);
    }
  }

  async getNodes(
    fileKey: string,
    nodeIds: string[],
    accessToken: string
  ): Promise<FigmaNodeResponse> {
    try {
      logger.debug('Fetching Figma nodes', { fileKey, nodeCount: nodeIds.length });
      
      const ids = nodeIds.join(',');
      const response = await this.httpClient.get<FigmaNodeResponse>(
        `/files/${fileKey}/nodes`,
        {
          params: { ids },
          headers: {
            'X-Figma-Token': accessToken,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          status: number; 
          headers?: Record<string, unknown>;
        } 
      };
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        if (status === 429) {
          const retryAfter = this.extractRetryAfter(axiosError.response.headers || {});
          logger.error('Figma API rate limit exceeded (429)', { fileKey, nodeCount: nodeIds.length, retryAfter });
          throw new RateLimitError(
            `Figma API rate limit exceeded. Please retry after ${retryAfter || 'some time'} seconds`,
            retryAfter
          );
        }
        
        const message = `Figma API error: ${status}`;
        logger.error(message, error, { fileKey, status });
        throw new FigmaApiError(message, status);
      }

      logger.error('Failed to fetch Figma nodes', error, { fileKey });
      throw new FigmaApiError('Failed to fetch Figma nodes', 500);
    }
  }
}


