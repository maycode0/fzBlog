import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type CountItem = { name: string; count: number };
export const POSTS_PER_PAGE = 7;

export function sortPosts(posts: BlogPost[]) {
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postUrl(post: BlogPost) {
	return `/blog/${post.id}/`;
}

export function pageUrl(page: number) {
	return page <= 1 ? '/' : `/page/${page}/`;
}

export function totalPages(posts: BlogPost[], pageSize = POSTS_PER_PAGE) {
	return Math.max(1, Math.ceil(posts.length / pageSize));
}

export function pagePosts(posts: BlogPost[], page: number, pageSize = POSTS_PER_PAGE) {
	const start = (page - 1) * pageSize;
	return posts.slice(start, start + pageSize);
}

export function readingStats(posts: BlogPost[]) {
	const words = posts.reduce((total, post) => total + estimateWords(post.body), 0);

	return {
		posts: posts.length,
		categories: countCategories(posts).length,
		tags: countTags(posts).length,
		words: formatWordCount(words),
	};
}

export function countCategories(posts: BlogPost[]): CountItem[] {
	return countValues(posts.map((post) => post.data.category || '笔记本'));
}

export function countTags(posts: BlogPost[]): CountItem[] {
	const tags = posts.flatMap((post) => post.data.tags?.length ? post.data.tags : inferTags(post));
	return countValues(tags);
}

export function archiveYears(posts: BlogPost[]): CountItem[] {
	const counts = new Map<string, number>();
	for (const post of posts) {
		const year = String(post.data.pubDate.getFullYear());
		counts.set(year, (counts.get(year) || 0) + 1);
	}

	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => Number(b.name) - Number(a.name));
}

export function relatedPosts(posts: BlogPost[], current: BlogPost, limit = 5) {
	const currentTags = new Set(current.data.tags?.length ? current.data.tags : inferTags(current));
	const category = current.data.category;

	return posts
		.filter((post) => post.id !== current.id)
		.map((post) => {
			const tags = post.data.tags?.length ? post.data.tags : inferTags(post);
			const tagScore = tags.filter((tag) => currentTags.has(tag)).length;
			const categoryScore = post.data.category === category ? 1 : 0;
			return { post, score: tagScore * 2 + categoryScore };
		})
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf())
		.slice(0, limit)
		.map((item) => item.post);
}

export function formatDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function excerpt(post: BlogPost, maxLength = 120) {
	const text = post.data.description || stripMarkdown(post.body);
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
}

export function estimateWords(text = '') {
	const cjk = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
	const words = text
		.replace(/[\u4e00-\u9fff]/g, ' ')
		.match(/[A-Za-z0-9_]+/g)?.length ?? 0;

	return cjk + words;
}

export function searchPosts(posts: BlogPost[], query: string) {
	const keyword = query.trim().toLowerCase();
	if (!keyword) return [];

	return posts
		.map((post) => {
			const haystack = [
				post.data.title,
				post.data.description,
				post.data.category,
				...(post.data.tags || []),
				stripMarkdown(post.body),
			].join(' ');
			const normalized = haystack.toLowerCase();
			const index = normalized.indexOf(keyword);

			return {
				post,
				index,
				snippet: index >= 0 ? buildSnippet(haystack, index, keyword.length) : '',
			};
		})
		.filter((result) => result.index >= 0);
}

export function highlight(text: string, query: string) {
	const keyword = query.trim();
	if (!keyword) return text;

	const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return text.replace(new RegExp(escaped, 'gi'), (match) => `<mark>${match}</mark>`);
}

export function inferTags(post: BlogPost) {
	const pool = `${post.data.title} ${post.data.description} ${post.body}`;
	const candidates = ['Astro', 'MDX', 'Markdown', 'CSS', 'JavaScript', '前端', '博客'];
	const tags = candidates.filter((tag) => pool.toLowerCase().includes(tag.toLowerCase()));

	return tags.length ? tags : ['随笔'];
}

function countValues(values: string[]): CountItem[] {
	const counts = new Map<string, number>();
	for (const value of values) {
		counts.set(value, (counts.get(value) || 0) + 1);
	}

	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function formatWordCount(words: number) {
	if (words >= 10000) return `${(words / 10000).toFixed(1)}`;
	if (words >= 1000) return `${(words / 1000).toFixed(1)}k`;
	return String(words);
}

function stripMarkdown(text = '') {
	return text
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[#>*_`~-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function buildSnippet(text: string, index: number, queryLength: number) {
	const start = Math.max(0, index - 70);
	const end = Math.min(text.length, index + queryLength + 140);
	const prefix = start > 0 ? '...' : '';
	const suffix = end < text.length ? '...' : '';

	return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}
