import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

export const client = createClient({
  projectId: 'rf2m4ovv', 
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-02-21',
});

const builder = createImageUrlBuilder(client);

export const urlFor = (source: any) => builder.image(source);