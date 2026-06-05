import { getApiUrl } from '../services/hostConfig';
import type { EventRecord } from '../db';

/**
 * Downloads a sketch image from the given URL and returns it as a Blob.
 * If the URL is relative (starts with '/'), prepends the current API host URL and sends the Auth token.
 * If the URL is absolute (e.g. S3 endpoint), requests it directly without the local API Auth header.
 */
export async function downloadSketchBlob(sketchUrl: string, token: string | null): Promise<Blob | null> {
  try {
    let url = sketchUrl;
    const headers: Record<string, string> = {};

    if (url.startsWith('/')) {
      const apiHost = getApiUrl();
      const sanitizedHost = apiHost.endsWith('/') ? apiHost.slice(0, -1) : apiHost;
      url = `${sanitizedHost}${url}`;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sketch image from ${url}: status ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading sketch blob:', error);
    return null;
  }
}

/**
 * Resolves/downloads sketch blobs for a list of event shells, reusing cached blobs if unchanged.
 */
export async function resolveSketchBlobs(
  events: EventRecord[],
  token: string | null,
  dbGetEvent: (id: number) => Promise<EventRecord | undefined>
): Promise<void> {
  for (const event of events) {
    if (event.sketch_url) {
      const existing = await dbGetEvent(event.id);
      if (existing && existing.sketch_url === event.sketch_url && existing.sketch_blob) {
        // Reuse cached blob
        event.sketch_blob = existing.sketch_blob;
      } else {
        // Download and attach
        event.sketch_blob = await downloadSketchBlob(event.sketch_url, token);
      }
    } else {
      event.sketch_blob = null;
    }
  }
}
