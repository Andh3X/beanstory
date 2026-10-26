export function siteUrl() {
  try {
    const url = new URL(process.env.SITE_URL || "https://beanstory.vercel.app");
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.origin;
  } catch { return "https://beanstory.vercel.app"; }
}
export function absolut(path) { return new URL(path, `${siteUrl()}/`).href; }
