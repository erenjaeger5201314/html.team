import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { randomUUID } from 'crypto';
import {
  MAX_HTML_SIZE_BYTES,
  SHORT_CODE_PATTERN,
  NO_STORE_CACHE_CONTROL,
  isValidHtmlContent,
  resolveCodeFromInput,
} from '@/lib/deploy-config';
import { createVersionedHtmlPath, getStoragePathFromFilePath } from '@/lib/storage';
import { jsonError, withNoStoreHeaders } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

async function fetchDeploymentByCode(code: string) {
  return supabase
    .from('deployments')
    .select('*')
    .eq('code', code)
    .maybeSingle();
}

function resolveStoragePath(deployment: { file_path?: string | null }, code: string) {
  return getStoragePathFromFilePath(deployment.file_path, code);
}

async function readHtmlContent(storagePath: string) {
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
    const code = resolveCodeFromInput({
      code: request.nextUrl.searchParams.get('code'),
      url: request.nextUrl.searchParams.get('url'),
    });

    if (!code || !SHORT_CODE_PATTERN.test(code)) {
      return jsonError({
        status: 400,
        code: 'INVALID_CODE_OR_URL',
        message: '璇锋彁渚涙湁鏁堢殑 code 鎴栭儴缃?url銆?,
        detail: '绀轰緥: ?code=abc123 鎴??url=https://html-team-three.vercel.app/s/abc123',
        requestId,
      });
    }

    const { data: deployment, error } = await fetchDeploymentByCode(code);
    if (error || !deployment) {
      return jsonError({
        status: 404,
        code: 'DEPLOYMENT_NOT_FOUND',
        message: '鏈壘鍒板搴旈儴缃层€?,
        detail: error?.message,
        requestId,
      });
    }

    const storagePath = resolveStoragePath(deployment, code);
    const { error: readError, content } = await readHtmlContent(storagePath);
    if (readError || content == null) {
      return jsonError({
        status: 404,
        code: 'HTML_CONTENT_NOT_FOUND',
        message: '鏈壘鍒拌閮ㄧ讲鐨?HTML 鍐呭銆?,
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
          'Cache-Control': NO_STORE_CACHE_CONTROL,
        },
      });
    }

    return NextResponse.json(
      {
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
      },
      withNoStoreHeaders()
    );
  } catch (error: any) {
    return jsonError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '璇诲彇閮ㄧ讲鍐呭澶辫触銆?,
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
      return jsonError({
        status: 415,
        code: 'UNSUPPORTED_CONTENT_TYPE',
        message: '浠呮敮鎸?application/json 璇锋眰銆?,
        detail: `褰撳墠 Content-Type 涓?${contentType || 'unknown'}`,
        requestId,
      });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError({
        status: 400,
        code: 'INVALID_PAYLOAD',
        message: '璇锋眰浣撳繀椤绘槸鍗曚釜 JSON 瀵硅薄銆?,
        requestId,
      });
    }

    const code = resolveCodeFromInput({ code: body.code, url: body.url });
    if (!code || !SHORT_CODE_PATTERN.test(code)) {
      return jsonError({
        status: 400,
        code: 'INVALID_CODE_OR_URL',
        message: '璇锋彁渚涙湁鏁堢殑 code 鎴栭儴缃?url銆?,
        detail: '绀轰緥: {"code":"abc123","content":"<!doctype html>..."}',
        requestId,
      });
    }

    if (typeof body.content !== 'string' || !body.content.trim()) {
      return jsonError({
        status: 400,
        code: 'INVALID_CONTENT',
        message: 'content 蹇呴』鏄潪绌哄瓧绗︿覆銆?,
        requestId,
      });
    }

    const normalizedContent = body.content.trim();
    const fileSize = Buffer.byteLength(normalizedContent, 'utf8');

    if (fileSize > MAX_HTML_SIZE_BYTES) {
      return jsonError({
        status: 413,
        code: 'FILE_TOO_LARGE',
        message: 'HTML 鏂囦欢浣撶Н瓒呭嚭闄愬埗銆?,
        detail: `褰撳墠澶у皬 ${fileSize} bytes锛屾渶澶у厑璁?${MAX_HTML_SIZE_BYTES} bytes銆俙,
        requestId,
      });
    }

    if (!isValidHtmlContent(normalizedContent)) {
      return jsonError({
        status: 400,
        code: 'INVALID_HTML',
        message: '鎻愪氦鍐呭涓嶆槸鏈夋晥鐨?HTML 鏂囨湰銆?,
        detail: '鍐呭涓嚦灏戝簲鍖呭惈 <!doctype html> 鎴?<html> 鏍囩銆?,
        requestId,
      });
    }

    const { data: deployment, error } = await fetchDeploymentByCode(code);
    if (error || !deployment) {
      return jsonError({
        status: 404,
        code: 'DEPLOYMENT_NOT_FOUND',
        message: '鏈壘鍒板搴旈儴缃层€?,
        detail: error?.message,
        requestId,
      });
    }

    const storagePath = createVersionedHtmlPath(code);
    const bucket = supabase.storage.from('deployments');
    const { error: updateFileError } = await bucket.update(storagePath, normalizedContent, {
      contentType: 'text/html',
      upsert: true,
    });

    if (updateFileError) {
      const { error: uploadFallbackError } = await bucket.upload(storagePath, normalizedContent, {
        contentType: 'text/html',
        upsert: true,
      });

      if (uploadFallbackError) {
        return jsonError({
          status: 500,
          code: 'HTML_UPDATE_FAILED',
          message: 'HTML 鍐呭鏇存柊澶辫触銆?,
          detail: `${updateFileError.message}; fallback: ${uploadFallbackError.message}`,
          requestId,
        });
      }
    }

    const updates: {
      file_size: number;
      updated_at: string;
      title?: string;
      filename?: string;
      file_path?: string;
    } = {
      file_size: fileSize,
      updated_at: new Date().toISOString(),
    };

    const {
      data: { publicUrl },
    } = supabase.storage.from('deployments').getPublicUrl(storagePath);
    updates.file_path = publicUrl;

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (typeof body.filename === 'string' && body.filename.trim()) {
      const normalizedFilename = body.filename.trim();
      if (!/\.html?$/i.test(normalizedFilename)) {
        return jsonError({
          status: 400,
          code: 'INVALID_FILENAME',
          message: 'filename 蹇呴』浠?.html 鎴?.htm 缁撳熬銆?,
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
      return jsonError({
        status: 500,
        code: 'DEPLOYMENT_UPDATE_FAILED',
        message: '閮ㄧ讲璁板綍鏇存柊澶辫触銆?,
        detail: updateError.message,
        requestId,
      });
    }

    return NextResponse.json(
      {
        success: true,
        requestId,
        id: deployment.id,
        code,
        updatedAt: updates.updated_at,
        fileSize,
        message: 'HTML 鍐呭宸叉洿鏂般€?,
        url: `${request.nextUrl.protocol}//${request.nextUrl.host}/s/${code}`,
      },
      withNoStoreHeaders()
    );
  } catch (error: any) {
    return jsonError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '鏇存柊閮ㄧ讲鍐呭澶辫触銆?,
      detail: error?.message,
      requestId,
    });
  }
}
