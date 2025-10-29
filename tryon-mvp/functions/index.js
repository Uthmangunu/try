const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.createTryOnJob = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required');

  const { inputImageUrl, outfitImageUrl, metrics } = data || {};

  // Validate required fields - now we need inputImageUrl and outfitImageUrl
  if (!inputImageUrl || !outfitImageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: inputImageUrl and outfitImageUrl');
  }

  const jobRef = db.collection('try_on_jobs').doc();
  await jobRef.set({
    userId: context.auth.uid,
    inputImageUrl,
    outfitImageUrl,
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
    // Call Banana.dev API for virtual try-on
    const bananaKey = functions.config().banana?.key;
    const modelKey = functions.config().banana?.model_key;

    if (!bananaKey || !modelKey) {
      throw new Error('Banana API credentials not configured. Run: firebase functions:config:set banana.key="YOUR_KEY" banana.model_key="YOUR_MODEL_KEY"');
    }

    const res = await fetch('https://api.banana.dev/start/v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bananaKey}`,
      },
      body: JSON.stringify({
        apiKey: bananaKey,
        modelKey: modelKey,
        modelInputs: {
          person_image: job.inputImageUrl,
          garment_image: job.outfitImageUrl,
          // Include metrics if available
          ...(job.metrics && {
            scale_factor: job.metrics.scaleFactor,
            shoulder_width: job.metrics.shoulderWidth,
            waist: job.metrics.waist,
            hip: job.metrics.hip,
          }),
        },
        startOnly: false, // Wait for result
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Banana API error: ${res.status} - ${errorText}`);
    }

    const result = await res.json();

    // Extract result URL from Banana response
    // Response structure may vary depending on the model
    let resultUrl = null;
    if (result.modelOutputs) {
      // Check various possible response formats
      resultUrl = result.modelOutputs.result_url ||
                  result.modelOutputs.output_image ||
                  result.modelOutputs[0]?.result_url ||
                  result.modelOutputs[0]?.image_url ||
                  null;
    }

    if (!resultUrl) {
      console.error('Unexpected Banana response:', JSON.stringify(result));
      throw new Error('No result image URL in Banana response');
    }

    const { fitScore, notes } = await scoreFit(job.metrics);

    await jobRef.update({
      status: 'succeeded',
      resultUrl,
      fitScore,
      notes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('Try-on job failed:', e);
    await jobRef.update({
      status: 'failed',
      error: e?.message || 'Unknown error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function scoreFit(metrics) {
  // Simple heuristic fit scoring based on body metrics
  // In a real implementation, this would be more sophisticated
  if (!metrics) {
    return {
      fitScore: 0.75,
      notes: 'Estimated fit based on standard sizing.',
    };
  }

  // Base score
  let fitScore = 0.85;
  const notes = [];

  // Adjust based on scale factor (how proportional the body is)
  const scaleFactor = metrics.scaleFactor || 1.0;
  if (scaleFactor < 0.9 || scaleFactor > 1.1) {
    fitScore -= 0.1;
    notes.push('Proportions may require size adjustment');
  }

  // Shoulder width assessment (typical range: 38-50cm)
  const shoulderWidth = metrics.shoulderWidth || 45;
  if (shoulderWidth < 40) {
    notes.push('Consider a smaller size for shoulders');
  } else if (shoulderWidth > 48) {
    notes.push('Consider a larger size for shoulders');
  } else {
    notes.push('Good shoulder fit expected');
  }

  // Keep score between 0 and 1
  fitScore = Math.max(0, Math.min(1, fitScore));

  return {
    fitScore,
    notes: notes.join('. ') + '.',
  };
}


