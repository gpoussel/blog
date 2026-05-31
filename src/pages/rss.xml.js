import rss from "@astrojs/rss";
import { SITE } from "../consts";
import { getPublishedPosts } from "../utils/posts";

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category],
      link: `/blog/${post.id}/`,
    })),
    customData: `<language>en</language>`,
  });
}
