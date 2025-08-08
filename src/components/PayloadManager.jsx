import React, { useState, useEffect } from 'react';
import { payloadsAPI } from '../services/api';
import { Play, Database, FileText, Users, MessageSquare, Activity, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PayloadManager = () => {
  const [stats, setStats] = useState({
    totalPayloads: 0,
    processedPayloads: 0,
    unprocessedPayloads: 0,
    totalUsers: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  // Load statistics on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await payloadsAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  const handleLoadPayloads = async () => {
    setLoading(true);
    setProcessingStep('Loading payload files to database...');

    try {
      const response = await payloadsAPI.loadPayloads();
      if (response.success) {
        toast.success(`Loaded ${response.data.loaded} payloads successfully`);
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error loading payloads:', error);
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleProcessPayloads = async () => {
    setLoading(true);
    setProcessingStep('Processing payloads into messages and users...');

    try {
      const response = await payloadsAPI.processPayloads();
      if (response.success) {
        toast.success(`Processed ${response.data.processed} payloads successfully`);
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error processing payloads:', error);
      toast.error('Failed to process payloads: ' + error.message);
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const handleFullProcess = async () => {
    setLoading(true);

    try {
      // Step 1: Load payloads
      setProcessingStep('Step 1/2: Loading payload files...');
      const loadResponse = await payloadsAPI.loadPayloads();

      if (loadResponse.success) {
        toast.success(`Loaded ${loadResponse.data.loaded} payloads`);

        // Step 2: Process payloads
        setProcessingStep('Step 2/2: Processing payloads...');
        const processResponse = await payloadsAPI.processPayloads();

        if (processResponse.success) {
          toast.success(`Complete! Created ${processResponse.data.messages} messages and ${processResponse.data.users} users`);
          fetchStats(); // Refresh stats
        }
      }
    } catch (error) {
      console.error('Error in full process:', error);
      toast.error('Failed to complete process: ' + error.message);
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-whatsapp-dark text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-whatsapp-green-light mb-2">
            WhatsApp Payload Manager
          </h1>
          <p className="text-gray-400">
            Load and process WhatsApp webhook payloads into your chat system
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Payloads</p>
                <p className="text-2xl font-bold text-white">{stats.totalPayloads}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Processed</p>
                <p className="text-2xl font-bold text-green-400">{stats.processedPayloads}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unprocessed</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.unprocessedPayloads}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Messages</p>
                <p className="text-2xl font-bold text-whatsapp-green-light">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-whatsapp-green-light" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-whatsapp-green-light">Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Load Payloads */}
            <button
              onClick={handleLoadPayloads}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                         text-white p-3 rounded-lg transition-colors"
            >
              <Database className="w-5 h-5" />
              Load Payloads
            </button>

            {/* Process Payloads */}
            <button
              onClick={handleProcessPayloads}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 
                         text-white p-3 rounded-lg transition-colors"
            >
              <Activity className="w-5 h-5" />
              Process Payloads
            </button>

            {/* Full Process */}
            <button
              onClick={handleFullProcess}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-whatsapp-green hover:bg-whatsapp-green-dark disabled:bg-gray-600 
                         text-white p-3 rounded-lg transition-colors"
            >
              <Play className="w-5 h-5" />
              Load & Process All
            </button>
          </div>

          {/* Refresh Stats */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Statistics
            </button>
          </div>
        </div>

        {/* Processing Status */}
        {loading && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-whatsapp-green"></div>
              <span className="text-whatsapp-green-light">{processingStep}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-whatsapp-green-light">How to Use</h3>
          <div className="space-y-2 text-gray-300">
            <p><strong>1. Load Payloads:</strong> First, load the payload files from the /payloads directory into the database</p>
            <p><strong>2. Process Payloads:</strong> Then, process the loaded payloads to create users and messages</p>
            <p><strong>3. Load & Process All:</strong> Or use this button to do both steps automatically</p>
            <p className="text-sm text-gray-400 mt-4">
              The payload files contain WhatsApp webhook data that will be converted into proper chat messages and user profiles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayloadManager;
