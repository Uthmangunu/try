'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { analyzePhoto, isGeminiNanoAvailable, PhotoAnalysis } from '@/lib/gemini-nano';
import axios from 'axios';

type Step = 'upload' | 'select-outfit' | 'result';

interface Outfit {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

export default function TryOnPage() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<Step>('upload');

  // Upload step state
  const [file, setFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Outfit selection step state
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [searchingOutfits, setSearchingOutfits] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // Result step state
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [geminiAvailable, setGeminiAvailable] = useState(false);

  const functions = useMemo(() => getFunctions(), []);

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
    isGeminiNanoAvailable().then(setGeminiAvailable);
  }, []);

  // Watch for job updates
  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(doc(db, 'try_on_jobs', jobId), (snap) => setJob(snap.data()));
    return () => unsub();
  }, [jobId]);

  async function signIn() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      alert('Could not access camera. Please use file upload instead.');
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        setFile(file);
        setPhotoPreview(canvas.toDataURL());
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  }

  async function uploadAndAnalyze() {
    if (!user) {
      await signIn();
      return;
    }

    if (!file) return;

    setAnalyzing(true);

    try {
      // Upload image to Firebase Storage
      const path = `user_uploads/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      setUploadedImageUrl(imageUrl);

      // Analyze photo with Gemini Nano
      let photoAnalysis: PhotoAnalysis;
      if (photoPreview && geminiAvailable) {
        photoAnalysis = await analyzePhoto(photoPreview);
      } else {
        photoAnalysis = await analyzePhoto('');
      }

      setAnalysis(photoAnalysis);

      // Search for outfits
      await searchOutfits(photoAnalysis.searchQuery);

      setStep('select-outfit');
    } catch (error: any) {
      alert('Failed to upload and analyze photo: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function searchOutfits(query: string) {
    setSearchingOutfits(true);
    try {
      const response = await axios.post('/api/search-outfits', { query });
      setOutfits(response.data.outfits || []);
    } catch (error: any) {
      alert('Failed to search outfits: ' + error.message);
      setOutfits([]);
    } finally {
      setSearchingOutfits(false);
    }
  }

  async function handleCustomSearch() {
    if (!customQuery.trim()) return;
    await searchOutfits(customQuery);
  }

  async function startTryOn() {
    if (!selectedOutfit || !uploadedImageUrl || !analysis) return;

    setStep('result');

    try {
      const call = httpsCallable(functions, 'createTryOnJob');
      const resp: any = await call({
        inputImageUrl: uploadedImageUrl,
        outfitImageUrl: selectedOutfit.url,
        metrics: {
          scaleFactor: analysis.scaleFactor,
          shoulderWidth: analysis.shoulderWidth,
          waist: analysis.waist,
          hip: analysis.hip,
        },
      });
      setJobId(resp.data.jobId);
    } catch (error: any) {
      alert('Failed to start try-on: ' + error.message);
      setStep('select-outfit');
    }
  }

  function reset() {
    setStep('upload');
    setFile(null);
    setPhotoPreview(null);
    setUploadedImageUrl(null);
    setAnalysis(null);
    setOutfits([]);
    setSelectedOutfit(null);
    setJobId(null);
    setJob(null);
    setCustomQuery('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Closet</h1>
          <p className="text-gray-600">Virtual try-on powered by AI</p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">Signed in as {user.email}</p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator number={1} label="Upload Photo" active={step === 'upload'} completed={step !== 'upload'} />
            <div className="w-12 h-0.5 bg-gray-300" />
            <StepIndicator number={2} label="Select Outfit" active={step === 'select-outfit'} completed={step === 'result'} />
            <div className="w-12 h-0.5 bg-gray-300" />
            <StepIndicator number={3} label="View Result" active={step === 'result'} completed={false} />
          </div>
        </div>

        {/* Step 1: Upload Photo */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Upload Your Photo</h2>

            {!photoPreview ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg text-gray-700 mb-2">Click to upload a full-body photo</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="text-center">
                  <p className="text-gray-500 mb-4">or</p>
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      📸 Take Photo with Camera
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={capturePhoto}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Capture
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <img src={photoPreview} alt="Preview" className="w-full max-h-96 object-contain rounded-lg" />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setFile(null);
                      setPhotoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={uploadAndAnalyze}
                    disabled={analyzing || !file}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? 'Analyzing...' : 'Continue'}
                  </button>
                </div>
                {geminiAvailable && (
                  <p className="text-sm text-green-600 text-center">✓ Gemini Nano available for local AI analysis</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Outfit */}
        {step === 'select-outfit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Select an Outfit</h2>

              {analysis && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm">
                  <p><strong>Analysis:</strong> {analysis.gender} • {analysis.bodyType} • {analysis.pose}</p>
                  <p className="text-gray-600 mt-1">Search: "{analysis.searchQuery}"</p>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSearch()}
                  placeholder="Try a custom search (e.g., 'summer dress floral')"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleCustomSearch}
                  disabled={searchingOutfits || !customQuery.trim()}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </div>

              {searchingOutfits ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Finding outfits...</p>
                </div>
              ) : outfits.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {outfits.map((outfit) => (
                    <div
                      key={outfit.id}
                      onClick={() => setSelectedOutfit(outfit)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedOutfit?.id === outfit.id
                          ? 'border-purple-600 ring-2 ring-purple-300'
                          : 'border-gray-200 hover:border-purple-400'
                      }`}
                    >
                      <img src={outfit.thumbnail} alt={outfit.title} className="w-full h-48 object-cover" />
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate">{outfit.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No outfits found. Try a different search.</p>
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={startTryOn}
                  disabled={!selectedOutfit}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Try On This Outfit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Your Virtual Try-On</h2>

            {job ? (
              <div className="space-y-6">
                <div className="text-center">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    job.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Status: {job.status}
                  </span>
                </div>

                {job.status === 'running' || job.status === 'queued' ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating your try-on... This may take 5-10 seconds.</p>
                  </div>
                ) : null}

                {job.resultUrl && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Original Photo</p>
                      <img src={uploadedImageUrl || ''} alt="Original" className="w-full rounded-lg border" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Try-On Result</p>
                      <img src={job.resultUrl} alt="Result" className="w-full rounded-lg border" />
                    </div>
                  </div>
                )}

                {job.fitScore && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium">Fit Score: {Math.round(job.fitScore * 100)}%</p>
                    {job.notes && <p className="text-sm text-gray-600 mt-1">{job.notes}</p>}
                  </div>
                )}

                {job.error && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-800 font-medium">Error: {job.error}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={reset}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Try Another Outfit
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Starting try-on...</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
        active ? 'bg-purple-600 text-white' :
        completed ? 'bg-green-500 text-white' :
        'bg-gray-300 text-gray-600'
      }`}>
        {completed ? '✓' : number}
      </div>
      <p className={`text-xs mt-2 ${active ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}


