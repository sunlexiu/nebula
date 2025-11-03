import type { ApiResp } from '@/types/api';

export async function request<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResp<T>> {
  try {
    const res = await fetch(input, init);
    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const message = typeof body === 'string' ? body : body?.message || '请求失败';
      const code = typeof body === 'string' ? res.status : (body?.code ?? res.status);
      return { ok: false, message, code };
    }
    return { ok: true, data: body as T };
  } catch (e: any) {
    return { ok: false, message: e?.message || '网络异常' };
  }
}