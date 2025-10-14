// Cloudflare Workers edge function for China geo-routing
// Deploy to Cloudflare Workers: https://workers.cloudflare.com/

export default {
  async fetch(request, env) {
    const country = request.cf?.country || '';
    const url = new URL(request.url);
    const host = url.hostname;

    // If already on CN site, serve as-is
    if (host === 'cn.zhengrowth.com') {
      return fetch(request);
    }

    // If visitor is in China (CN), redirect to cn subdomain
    if (country === 'CN') {
      url.hostname = 'cn.zhengrowth.com';
      return Response.redirect(url.toString(), 302);
    }

    // Otherwise serve global build
    return fetch(request);
  }
};
