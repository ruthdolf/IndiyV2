import React, { useState, useEffect } from 'react';
import { auth, storage, db } from '../firebase';
import { ref, getMetadata, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { Terminal, Shield, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const FirebaseDiagnostics: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    const user = auth.currentUser;
    const results: any = {
      timestamp: new Date().toISOString(),
      auth: {
        status: user ? 'Authenticated' : 'Not Authenticated',
        uid: user?.uid || 'N/A',
        email: user?.email || 'N/A',
        emailVerified: user?.emailVerified ? 'Yes' : 'No',
      },
      storage: {
        bucket: storage.app.options.storageBucket,
        handshake: 'Pending'
      },
      firestore: {
        status: 'Pending'
      }
    };

    try {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        results.firestore = {
          status: 'Connected',
          role: userDoc.exists() ? userDoc.data().role : 'No Profile Found',
          canReadOwnProfile: userDoc.exists() ? 'Success' : 'Profile Missing'
        };
      }
    } catch (e: any) {
      results.firestore = { status: 'Error', message: e.message };
    }

    try {
      const probeRef = ref(storage, 'test-connection.txt');
      await getMetadata(probeRef);
      results.storage.handshake = 'Success (Probe file found)';
    } catch (e: any) {
      if (e.code === 'storage/unauthorized') {
        results.storage.handshake = 'Permission Denied (Rules Blocking)';
      } else if (e.code === 'storage/object-not-found') {
        results.storage.handshake = 'Success (Path exists, file missing)';
      } else {
        results.storage.handshake = `Error: ${e.code}`;
      }
    }

    setReport(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-900 p-4 flex items-center gap-3">
        <Terminal className="w-5 h-5 text-green-400" />
        <h3 className="font-mono text-sm text-gray-300">Firebase System Diagnostics</h3>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auth Card */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
              <Shield className="w-4 h-4" />
              Authentication
            </div>
            <div className="space-y-1 text-xs font-mono">
              <p className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={report.auth.status === 'Authenticated' ? 'text-green-600' : 'text-red-600'}>
                  {report.auth.status}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">UID:</span>
                <span className="text-gray-900">{report.auth.uid}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900">{report.auth.email}</span>
              </p>
            </div>
          </div>

          {/* Storage Card */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
              <FileCheck className="w-4 h-4" />
              Storage Environment
            </div>
            <div className="space-y-1 text-xs font-mono">
              <p className="flex justify-between">
                <span className="text-gray-500">Bucket:</span>
                <span className="text-gray-900 select-all">{report.storage.bucket}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Handshake:</span>
                <span className={report.storage.handshake.includes('Success') ? 'text-green-600' : 'text-orange-600'}>
                  {report.storage.handshake}
                </span>
              </p>
            </div>
          </div>
        </div>

        {report.storage.handshake.includes('Permission Denied') && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-bold">Urgent Action Required</p>
              <p>Your Storage Rules are currently blocking the application. This happens because Storage rules do not automatically deploy from this editor.</p>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Go to the <a href="https://console.firebase.google.com" target="_blank" className="font-bold underline">Firebase Console</a>.</li>
                <li>Go to <b>Storage</b> &gt; <b>Rules</b>.</li>
                <li>Ensure your rules match the latest <code>storage.rules</code> in this project.</li>
              </ul>
            </div>
          </div>
        )}

        <button 
          onClick={runDiagnostics}
          className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4" />
          Refresh Status
        </button>
      </div>
    </div>
  );
};
