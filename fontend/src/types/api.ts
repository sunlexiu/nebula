export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; message: string; code?: string | number };
export type ApiResp<T> = ApiOk<T> | ApiErr;

export interface MoveNodeReq { sourceId: string; targetId?: string | null; }
export interface TestConnectionReq { id?: string; url?: string; username?: string; password?: string; }