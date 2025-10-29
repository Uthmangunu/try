const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.createTryOnJob = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required');

  const { garmentId, size, inputImageUrl, maskUrl, metrics } = data || {};
  if (!garmentId || !size || !inputImageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const jobRef = db.collection('try_on_jobs').doc();
  await jobRef.set({
    userId: context.auth.uid,
    garmentId,
    size,
    inputImageUrl,
    maskUrl: maskUrl || null,
    metrics: metrics || null,
    status: 'queued',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  processJob(jobRef.id).catch((e) => console.error('processJob error', e));

  return { jobId: jobRef.id, status: 'queued' };
});

async function processJob(jobId) {
  const jobRef = db.collection('try_on_jobs').doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) return;

  await jobRef.update({ status: 'running', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  const job = jobSnap.data();

  try {
    const res = await fetch('https://api.banana.dev/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${functions.config().banana?.key || ''}`,
      },
      body: JSON.stringify({
        modelKey: functions.config().banana?.model_key || '',
        modelInputs: {
          person_image_url: job.inputImageUrl,
          person_mask_url: job.maskUrl,
          garment_id: job.garmentId,
          size: job.size,
        },
      }),
    }).then((r) => r.json());

    const resultUrl = res?.modelOutputs?.[0]?.result_url || null;
    const { fitScore, notes } = await scoreFit(job.metrics, job.size);

    await jobRef.update({
      status: 'succeeded',
      resultUrl,
      fitScore,
      notes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    await jobRef.update({
      status: 'failed',
      error: e?.message || 'Unknown error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function scoreFit(metrics, size) {
  const fitScore = 0.8; // 0..1
  const notes = 'Looks like a good shoulder fit; length likely okay.';
  return { fitScore, notes };
}


