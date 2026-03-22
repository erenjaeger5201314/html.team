import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { randomUUID } from 'crypto';

const MAX_HTML_SIZE_BYTES = 1024 * 1024; // 1 MB
const CODE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{2,30}[a-z0-9])?$/;

type ResolveCodeInput = {
  code?: unknown;
  url?: unknown;
};

function failResponse(options: {
  status: number;
  code: string;
  message: string;
  detail?: string;
  requestId: string;
}) {
  return NextResponse.json(
    {
      success: false,
      error: options.message,
      errorCode: options.code,
      detail: options.detail,
      requestId: options.requestId,
    },
    { status: options.status }
  );
}

function resolveCode(input: ResolveCodeInput): string | null {
  if (typeof input.code === 'string' && input.code.trim()) {
    return input.code.trim().toLowerCase();
  }

  if (typeof input.url === 'string' && input.url.trim()) {
    try {
      const parsed = new URL(input.url.trim());
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 's') {
        return parts[1].toLowerCase();
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function fetchDeploymentByCode(code: string) {
  return supabase
    .from('deployments')
    .select('*')
    .eq('code', code)
    .maybeSingle();
}

async function readHtmlContent(code: string) {
  const storagePath = `html/${code}.html`;
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('deployments')
    .download(storagePath);

  if (downloadError || !fileData) {
    return { error: downloadError?.message || 'File not found', content: null };
  }

  const content = await fileData.text();
  return { error: null, content };
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();

  try {
    const code = resolveCode({
      code: request.nextUrl.searchParams.get('code'),
      url: request.nextUrl.searchParams.get('url'),
    });

    if (!code || !CODE_PATTERN.test(code)) {
      return failResponse({
        status: 400,
        code: 'INVALID_CODE_OR_URL',
        message: '请提供有效的 code 或部署 url。',
        detail: '示例: ?code=abc123 或 ?url=https://www.htmlcode.fun/s/abc123',
        requestId,
      });
    }

    const { data: deployment, error } = await fetchDeploymentByCode(code);
    if (error || !deployment) {
      return failResponse({
        status: 404,
        code: 'DEPLOYMENT_NOT_FOUND',
        message: '未找到对应部署。',
        detail: error?.message,
        requestId,
      });
    }

    const { error: readError, content } = await readHtmlContent(code);
    if (readError || content == null) {
      return failResponse({
        status: 404,
        code: 'HTML_CONTENT_NOT_FOUND',
        message: '未找到该部署的 HTML 内容。',
        detail: readError || undefined,
        requestId,
      });
    }

    const shouldDownload = request.nextUrl.searchParams.get('download') === '1';
    if (shouldDownload) {
      const downloadFilename = deployment.filename || `${code}.html`;
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      requestId,
      id: deployment.id,
      code: deployment.code,
      status: deployment.status,
      title: deployment.title,
      filename: deployment.filename,
      url: `${request.nextUrl.protocol}//${request.nextUrl.host}/s/${deployment.code}`,
      filePath: deployment.file_path,
      fileSize: deployment.file_size,
      content,
      createdAt: deployment.created_at,
      updatedAt: deployment.updated_at,
    });
  } catch (error: any) {
    return failResponse({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '读取部署内容失败。',
      detail: error?.message,
      requestId,
    });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = randomUUID();

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return failResponse({
        status: 415,
        code: 'UNSUPPORTED_CONTENT_TYPE',
        message: '仅支持 application/json 请求。',
        detail: `当前 Content-Type 为 ${contentType || 'unknown'}`,
        requestId,
      });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return failResponse({
        status: 400,
        code: 'INVALID_PAYLOAD',
        message: '请求体必须是单个 JSON 对象。',
        requestId,
      });
    }

    const code = resolveCode({ code: body.code, url: body.url });
    if (!code || !CODE_PATTERN.test(code)) {
      return failResponse({
        status: 400,
        code: 'INVALID_CODE_OR_URL',
        message: '请提供有效的 code 或部署 url。',
        detail: '示例: {"code":"abc123","content":"<!doctype html>..."}',
        requestId,
      });
    }

    if (typeof body.content !== 'string' || !body.content.trim()) {
      return failResponse({
        status: 400,
        code: 'INVALID_CONTENT',
        message: 'content 必须是非空字符串。',
        requestId,
      });
    }

    const normalizedContent = body.content.trim();
    const fileSize = Buffer.byteLength(normalizedContent, 'utf8');

    if (fileSize > MAX_HTML_SIZE_BYTES) {
      return failResponse({
        status: 413,
        code: 'FILE_TOO_LARGE',
        message: 'HTML 文件体积超出限制。',
        detail: `当前大小 ${fileSize} bytes，最大允许 ${MAX_HTML_SIZE_BYTES} bytes。`,
        requestId,
      });
    }

    if (!/(<!doctype html|<html[\s>])/i.test(normalizedContent)) {
      return failResponse({
        status: 400,
        code: 'INVALID_HTML',
        message: '提交内容不是有效的 HTML 文本。',
        detail: '内容中至少应包含 <!doctype html> 或 <html> 标签。',
        requestId,
      });
    }

    const { data: deployment, error } = await fetchDeploymentByCode(code);
    if (error || !deployment) {
      return failResponse({
        status: 404,
        code: 'DEPLOYMENT_NOT_FOUND',
        message: '未找到对应部署。',
        detail: error?.message,
        requestId,
      });
    }

    const storagePath = `html/${code}.html`;
    const { error: uploadError } = await supabase.storage
      .from('deployments')
      .upload(storagePath, normalizedContent, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      return failResponse({
        status: 500,
        code: 'HTML_UPDATE_FAILED',
        message: 'HTML 内容更新失败。',
        detail: uploadError.message,
        requestId,
      });
    }

    const updates: {
      file_size: number;
      updated_at: string;
      title?: string;
      filename?: string;
    } = {
      file_size: fileSize,
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (typeof body.filename === 'string' && body.filename.trim()) {
      const normalizedFilename = body.filename.trim();
      if (!/\.html?$/i.test(normalizedFilename)) {
        return failResponse({
          status: 400,
          code: 'INVALID_FILENAME',
          message: 'filename 必须以 .html 或 .htm 结尾。',
          requestId,
        });
      }
      updates.filename = normalizedFilename;
    }

    const { error: updateError } = await supabase
      .from('deployments')
      .update(updates)
      .eq('id', deployment.id);

    if (updateError) {
      return failResponse({
        status: 500,
        code: 'DEPLOYMENT_UPDATE_FAILED',
        message: '部署记录更新失败。',
        detail: updateError.message,
        requestId,
      });
    }

    return NextResponse.json({
      success: true,
      requestId,
      id: deployment.id,
      code,
      updatedAt: updates.updated_at,
      fileSize,
      message: 'HTML 内容已更新。',
      url: `${request.nextUrl.protocol}//${request.nextUrl.host}/s/${code}`,
    });
  } catch (error: any) {
    return failResponse({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '更新部署内容失败。',
      detail: error?.message,
      requestId,
    });
  }
}
