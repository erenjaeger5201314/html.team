import Link from 'next/link';

export default function ApiDocsPage() {
  const sampleRequest = `curl -X POST https://www.htmlcode.fun/api/deploy \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "index.html",
    "title": "my-agent-page",
    "content": "<!doctype html><html><body><h1>Hello Agent</h1></body></html>"
  }'`;

  const sampleSuccess = `{
  "success": true,
  "id": "uuid",
  "code": "abc123",
  "url": "https://www.htmlcode.fun/s/abc123",
  "qrCode": "https://.../qrcodes/abc123.png",
  "requestId": "uuid",
  "cooldownSeconds": 10,
  "nextAvailableAt": "2026-03-16T12:00:10.000Z"
}`;

  const sampleCooldown = `{
  "success": false,
  "error": "当前处于部署冷却期，请稍后再试。",
  "errorCode": "COOLDOWN_ACTIVE",
  "detail": "部署成功后需等待 10 秒。",
  "stage": "rate_limit",
  "requestId": "uuid",
  "retryAfterSeconds": 7
}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">API 部署快速文档</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          返回首页
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">接口说明</h2>
        <p className="text-sm text-gray-700">部署入口：POST /api/deploy</p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>请求头必须为 Content-Type: application/json</li>
          <li>请传 JSON 对象（filename + content + 可选 title）</li>
          <li>不要使用 curl -F file 或 multipart/form-data</li>
          <li>仅支持单个 HTML 请求，不支持批量部署</li>
          <li>每次部署成功后，全局冷却 10 秒</li>
          <li>冷却期间返回 429，并包含 retryAfterSeconds</li>
          <li>最大 HTML 体积 1 MB</li>
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">请求示例</h2>
        <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleRequest}</pre>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">成功响应示例</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleSuccess}</pre>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">冷却响应示例</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleCooldown}</pre>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-900">常见错误调用（不要这样用）</p>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">curl -L -X POST https://www.htmlcode.fun/api/deploy -F "file=@index.html"</pre>
          <p className="text-sm text-amber-800">
            如果上传方式不正确，接口会返回结构化错误字段：errorCode、hint、docs、stage、detail、requestId。
          </p>
        </div>
      </div>
    </div>
  );
}
