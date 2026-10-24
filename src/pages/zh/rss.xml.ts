import type { APIRoute } from 'astro';
import { newsFeed } from '../../lib/rss-route';

export const GET: APIRoute = ({ site }) => newsFeed('zh', site!);
