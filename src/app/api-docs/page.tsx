import Link from 'next/link';
import agentDocs from '@/content/agent-docs.json';

export default function ApiDocsPage() {
  const sampleRequest = `curl -X POST https://html-team-three.vercel.app/api/deploy \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "index.html",
    "title": "my-agent-page",
    "content": "<!doctype html><html><body><h1>Hello Agent</h1></body></html>"
  }'`;

  const sampleCustomCodeRequest = `curl -X POST https://html-team-three.vercel.app/api/deploy \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "landing.html",
    "title": "my-landing",
    "content": "<!doctype html><html><body><h1>Landing</h1></body></html>",
    "enableCustomCode": true,
    "customCode": "my-site-01"
  }'`;

  const sampleReadRequest = `curl "https://html-team-three.vercel.app/api/deploy/content?code=my-site-01"`;
  const sampleDownloadRequest = `curl -L "https://html-team-three.vercel.app/api/deploy/content?code=my-site-01&download=1" -o page.html`;
  const sampleUpdateRequest = `curl -X PATCH https://html-team-three.vercel.app/api/deploy/content \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "my-site-01",
    "content": "<!doctype html><html><body><h1>Updated</h1></body></html>",
    "title": "my-landing-v2",
    "filename": "landing-v2.html"
  }'`;

  const sampleSuccess = `{
  "success": true,
  "id": "uuid",
  "code": "abc123",
  "url": "https://html-team-three.vercel.app/s/abc123",
  "qrCode": "https://.../qrcodes/abc123.png",
  "requestId": "uuid",
  "cooldownSeconds": 10,
  "nextAvailableAt": "2026-03-16T12:00:10.000Z"
}`;

  const sampleCooldown = `{
  "success": false,
  "error": "褰撳墠澶勪簬閮ㄧ讲鍐峰嵈鏈燂紝璇风◢鍚庡啀璇曘€?,
  "errorCode": "COOLDOWN_ACTIVE",
  "detail": "閮ㄧ讲鎴愬姛鍚庨渶绛夊緟 10 绉掋€?,
  "stage": "rate_limit",
  "requestId": "uuid",
  "retryAfterSeconds": 7
}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">API 閮ㄧ讲蹇€熸枃妗?/h1>
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          杩斿洖棣栭〉
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">鎺ュ彛璇存槑</h2>
        <p className="text-sm text-gray-700">閮ㄧ讲鍏ュ彛锛歅OST /api/deploy</p>
        <p className="text-sm text-gray-700">鍐呭鍗忎綔锛欸ET /api/deploy/content銆丳ATCH /api/deploy/content</p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          {agentDocs.apiRules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">璇锋眰绀轰緥</h2>
        <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleRequest}</pre>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">鑷畾涔夌煭閾鹃儴缃茬ず渚嬶紙榛樿鍏抽棴锛?/h2>
        <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleCustomCodeRequest}</pre>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">璇诲彇 HTML 鍐呭</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleReadRequest}</pre>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">涓嬭浇 HTML 鏂囦欢</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleDownloadRequest}</pre>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">鏇存柊 HTML 鍐呭</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleUpdateRequest}</pre>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">鎴愬姛鍝嶅簲绀轰緥</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleSuccess}</pre>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">鍐峰嵈鍝嶅簲绀轰緥</h2>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{sampleCooldown}</pre>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-900">甯歌閿欒璋冪敤锛堜笉瑕佽繖鏍风敤锛?/p>
          <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">curl -L -X POST https://html-team-three.vercel.app/api/deploy -F "file=@index.html"</pre>
          <p className="text-sm text-amber-800">
            {agentDocs.commonErrorTip}
          </p>
        </div>
      </div>
    </div>
  );
}
