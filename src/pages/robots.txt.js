export function GET({ site }) {
	const sitemap = new URL('sitemap-index.xml', site)
	const cuerpo = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`
	return new Response(cuerpo, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	})
}
