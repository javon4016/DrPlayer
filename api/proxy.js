// api/proxy.js
export default async function handler(req, res) {
  // 允许跨域请求（必选）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 获取前端传递的直播源 URL（从 query 参数中取 url）
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: '缺少直播源 URL 参数' });
  }

  try {
    // 转发请求到直播源（使用 fetch 或 axios）
    const response = await fetch(decodeURIComponent(url), {
      method: 'GET',
      headers: {
        // 模拟浏览器请求头，避免部分服务器拦截
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Referer': '', // 清除 Referer 减少跨域限制
      },
      // 转发响应头（如 Content-Type，确保播放器能识别格式）
    });

    // 将直播源的响应转发给前端
    res.status(response.status);
    // 复制响应头（例如 M3U8/FLV 的 Content-Type）
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    // 转发响应体（流式传输，适合大视频）
    const body = await response.arrayBuffer();
    res.send(Buffer.from(body));

  } catch (error) {
    console.error('代理请求失败：', error);
    res.status(500).json({ error: '代理服务异常' });
  }
}
