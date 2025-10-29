'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';

export default function TryOnPage() {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const functions = useMemo(() => getFunctions(), []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function signIn() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function uploadImage() {
    if (!user || !file) return null;
    const path = `user_uploads/${user.uid}/${Date.now()}_${file.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  }

  async function computeMetricsLocally(imageUrl: string) {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.ai?.languageModel) {
        // @ts-ignore
        const session = await window.ai.languageModel.create();
        const prompt = `You are a sizing assistant. Given a full-body photo URL: ${imageUrl}, estimate scale factor and basic widths from pose. Respond JSON with keys: scaleFactor, shoulderWidth, waist, hip.`;
        const out = await session.prompt(prompt);
        const json = JSON.parse(out);
        return json;
      }
    } catch {}
    return { scaleFactor: 1.0, shoulderWidth: 45, waist: 70, hip: 90 };
  }

  async function startJob() {
    if (!user) await signIn();
    const inputImageUrl = await uploadImage();
    if (!inputImageUrl) return;
    const metrics = await computeMetricsLocally(inputImageUrl);

    const call = httpsCallable(functions, 'createTryOnJob');
    const resp: any = await call({
      garmentId: 'demo-garment',
      size: 'M',
      inputImageUrl,
      maskUrl: null,
      metrics,
    });
    setJobId(resp.data.jobId);
  }

  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(doc(db, 'try_on_jobs', jobId), (snap) => setJob(snap.data()));
    return () => unsub();
  }, [jobId]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Virtual Try-On</h1>
      {!user ? (
        <button onClick={signIn} className="px-4 py-2 bg-black text-white rounded">Sign in with Google</button>
      ) : (
        <div className="mb-4">Signed in as {user.email}</div>
      )}

      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={startJob} disabled={!file} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
        Start try-on
      </button>

      {job && (
        <div className="mt-6 space-y-2">
          <div>Status: <span className="font-mono">{job.status}</span></div>
          {job.resultUrl && <img src={job.resultUrl} className="w-full rounded border" alt="Result" />}
          {job.fitScore && <div>Fit score: {Math.round(job.fitScore * 100)}%</div>}
          {job.notes && <div className="text-sm text-gray-600">{job.notes}</div>}
          {job.error && <div className="text-sm text-red-600">{job.error}</div>}
        </div>
      )}
    </main>
  );
}


