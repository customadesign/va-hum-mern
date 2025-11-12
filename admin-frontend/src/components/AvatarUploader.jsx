/* eslint-disable no-console */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import supabase, { getSupabaseUser, getSupabaseSession } from '../services/supabaseClient';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIM = 1024; // px
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getExt(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

async function downsizeImage(file, maxDim = MAX_DIM) {
  try {
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    if (scale >= 1) {
      URL.revokeObjectURL(url);
      return file; // no resize needed
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const type = file.type || 'image/jpeg';
    const quality = 0.9;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    const resized = new File([blob], file.name, { type });
    return resized;
  } catch (e) {
    console.warn('[AvatarUploader] downsize failed, using original file:', e?.message || e);
    return file;
  }
}

function HumanError({ code, message, requestId }) {
  return (
    <div className="text-sm text-red-600">
      {message}
      {code ? <span className="ml-1 opacity-75">({code})</span> : null}
      {requestId ? <span className="ml-1 opacity-60">[req:{requestId}]</span> : null}
    </div>
  );
}

export default function AvatarUploader({
  user, // expected to contain { id, email }
  onUploaded, // (url) => void
  className = '',
  buttonLabel = 'Change Avatar',
  maxSize = MAX_SIZE,
  accept = 'image/jpeg,image/png,image/webp',
  downsize = true
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(null);
  const [requestId, setRequestId] = useState(null);

  const uid = useMemo(() => {
    return user?.id || user?._id || (user?.email ? user.email.split('@')[0] : 'unknown');
  }, [user]);

  const openPicker = useCallback(() => {
    setErr(null);
    inputRef.current?.click();
  }, []);

  // Simulated progress while upload is in progress (Supabase storage upload lacks browser progress)
  const startProgress = useCallback(() => {
    setProgress(5);
    const start = Date.now();
    const timer = setInterval(() => {
      setProgress((p) => {
        // advance to 90% over ~3 seconds
        const elapsed = Date.now() - start;
        const target = Math.min(90, Math.floor((elapsed / 3000) * 90));
        return Math.max(p, target);
      });
    }, 150);
    return () => clearInterval(timer);
  }, []);

  const clientUploadToSupabase = useCallback(async (file) => {
    if (!supabase) {
      return { ok: false, code: 'NO_CLIENT', message: 'Supabase client not initialized' };
    }
    // Ensure we at least have a session; if your app does not use Supabase Auth, policies must allow anon uploads or use backend proxy
    const session = await getSupabaseSession().catch(() => null);
    if (!session) {
      console.warn('[AvatarUploader] No Supabase session. Ensure bucket policies allow this operation or fallback to backend proxy.');
    }

    const ext = getExt(file.type || 'image/jpeg');
    const path = `${uid}/${Date.now()}-${uuidv4()}.${ext}`;
    try {
      console.log('[AvatarUploader] Uploading to Supabase Storage', { bucket: 'avatars', path, mime: file.type, size: file.size });
      const { error } = await supabase.storage.from('avatars').upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
        cacheControl: '3600'
      });
      if (error) {
        console.error('[AvatarUploader] Supabase upload error:', error);
        return { ok: false, code: error?.statusCode || error?.code || 'UPLOAD_FAILED', message: error?.message || 'Upload failed' };
      }
      // Try public URL; if bucket is private, this may not be accessible
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      let finalUrl = publicUrl;
      if (!publicUrl) {
        // Attempt a signed URL if policies permit
        try {
          const { data: signed, error: sErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
          if (sErr) {
            console.warn('[AvatarUploader] createSignedUrl error:', sErr?.message);
          } else {
            finalUrl = signed?.signedUrl;
          }
        } catch (e) {
          console.warn('[AvatarUploader] createSignedUrl exception:', e?.message);
        }
      }
      if (!finalUrl) {
        return { ok: false, code: 'NO_URL', message: 'No URL returned from storage' };
      }
      return { ok: true, url: finalUrl, storage: 'supabase', key: path };
    } catch (e) {
      console.error('[AvatarUploader] Unexpected supabase error:', e?.message || e);
      return { ok: false, code: 'EXCEPTION', message: e?.message || 'Unexpected error' };
    }
  }, [uid]);

  const backendProxyUpload = useCallback(async (file) => {
    const rid = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setRequestId(rid);
    const form = new FormData();
    // our backend proxy expects field name "file" (it also tolerates "avatar")
    form.append('file', file);
    form.append('userId', uid || 'unknown');

    try {
      console.log('[AvatarUploader] Uploading via backend proxy /api/admin/profile/avatar', { rid, uid, mime: file.type, size: file.size });
      const res = await api.post('/admin/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      const body = res?.data || {};
      if (!body?.url) {
        return { ok: false, code: body?.code || 'NO_URL', message: body?.message || 'No URL returned', requestId: body?.requestId || rid };
      }
      return {
        ok: true,
        url: body.url,
        storage: body.storage || 'unknown',
        key: body.key,
        requestId: body.requestId || rid
      };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Upload failed';
      const code = e?.response?.data?.code || 'UPLOAD_FAILED';
      const reqId = e?.response?.data?.requestId || rid;
      console.error('[AvatarUploader] Backend proxy error:', { code, msg, reqId, detail: e?.response?.data });
      return { ok: false, code, message: msg, requestId: reqId };
    }
  }, [uid]);

  const handlePick = useCallback(async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = ''; // reset picker so the same file can be chosen again
    setErr(null);
    if (!file) return;

    // validation
    if (!ALLOWED.has(file.type)) {
      setErr({ code: 'UNSUPPORTED_TYPE', message: 'Invalid image type. Please select JPEG, PNG, or WebP.' });
      return;
    }
    if (file.size > maxSize) {
      setErr({ code: 'TOO_LARGE', message: `File too large. Max allowed is ${Math.round(maxSize / (1024 * 1024))}MB.` });
      return;
    }

    setBusy(true);
    const stop = startProgress();
    try {
      const finalFile = downsize ? await downsizeImage(file) : file;

      // Preferred path: client Supabase upload (if client is configured)
      let outcome = await clientUploadToSupabase(finalFile);
      if (!outcome.ok) {
        // Fall back to backend proxy with service role
        outcome = await backendProxyUpload(finalFile);
      }

      if (!outcome.ok) {
        setErr({ code: outcome.code, message: outcome.message, requestId: outcome.requestId });
        return;
      }

      setProgress(100);
      console.log('[AvatarUploader] Upload success', outcome);
      onUploaded?.(outcome.url, outcome);
    } finally {
      stop();
      setBusy(false);
      // ensure progress bar finishes
      setTimeout(() => setProgress(0), 600);
    }
  }, [backendProxyUpload, clientUploadToSupabase, downsize, maxSize, onUploaded, startProgress]);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handlePick}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openPicker}
          className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={busy}
          data-test="avatar-pick"
        >
          {busy ? 'Uploading...' : buttonLabel}
        </button>
        {busy && (
          <div className="flex-1 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-500 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      {err && (
        <div className="mt-2">
          <HumanError code={err.code} message={err.message} requestId={err.requestId} />
        </div>
      )}
      {!supabase && (
        <div className="mt-2 text-xs text-amber-600">
          Supabase client is not configured (REACT_APP_SUPABASE_URL/ANON missing). Using backend proxy for uploads.
        </div>
      )}
    </div>
  );
}