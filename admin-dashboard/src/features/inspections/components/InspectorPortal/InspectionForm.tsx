import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { InspectionRequest } from '../../../../types';
import axios from 'axios';
import { handleApiError } from '../../../../utils/errorHandler';

const API_BASE = 'http://localhost:4000';

interface InspectionFormProps {
  inspection: InspectionRequest;
  onClose: () => void;
  onComplete: () => void;
}

const getAuthToken = () => localStorage.getItem('adminToken');

export const InspectionForm: React.FC<InspectionFormProps> = ({
  inspection,
  onClose,
  onComplete,
}) => {
  const [qualityScore, setQualityScore] = useState<number>(75);
  const [qualityGrade, setQualityGrade] = useState<string>('Standard');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-suggest quality grade based on score
  useEffect(() => {
    if (qualityScore >= 71) {
      setQualityGrade('Premium');
    } else if (qualityScore >= 41) {
      setQualityGrade('Standard');
    } else {
      setQualityGrade('Feed');
    }
  }, [qualityScore]);

  const getScoreColor = (score: number): string => {
    if (score >= 71) return 'text-green-600';
    if (score >= 41) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 71) return 'bg-green-100';
    if (score >= 41) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 71) return 'bg-green-500';
    if (score >= 41) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (qualityScore < 0 || qualityScore > 100) {
      const errorMsg = 'Quality score must be between 0 and 100';
      setError(errorMsg);
      toast.error('Invalid Input', { description: errorMsg });
      return;
    }

    if (!qualityGrade) {
      const errorMsg = 'Quality grade is required';
      setError(errorMsg);
      toast.error('Invalid Input', { description: errorMsg });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = getAuthToken();

      // Call the backend API to update inspection
      await axios.patch(
        `${API_BASE}/inspections/${inspection.id}`,
        {
          status: 'COMPLETED',
          qualityScore: qualityScore,
          qualityGrade: qualityGrade,
          notes: notes || undefined,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setSuccess(true);

      // Show success toast
      toast.success('Inspection completed successfully!', {
        description: `Quality: ${qualityGrade} (Score: ${qualityScore})`,
      });

      // Show success message briefly then close
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting inspection:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit inspection results. Please try again.';
      setError(errorMsg);
      handleApiError(err, 'Failed to submit inspection results');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Inspection</h2>
            <p className="text-sm text-gray-500 mt-1">
              {inspection.saleListing?.product?.name} - {inspection.saleListing?.seller?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-green-900 font-semibold">Inspection Completed</h3>
              <p className="text-green-700 text-sm mt-1">
                Results have been submitted successfully.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-900 font-semibold">Submission Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Inspection Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Location:</span>
              <span className="text-gray-900 font-medium">
                {inspection.address || `${inspection.latitude.toFixed(4)}, ${inspection.longitude.toFixed(4)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity:</span>
              <span className="text-gray-900 font-medium">
                {inspection.saleListing?.quantity} {inspection.saleListing?.unit}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Priority:</span>
              <span className={`font-semibold ${
                inspection.priority === 'HIGH' ? 'text-red-600' :
                inspection.priority === 'MEDIUM' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {inspection.priority}
              </span>
            </div>
          </div>

          {/* Quality Score */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quality Score (0-100) *
            </label>

            {/* Score Display */}
            <div className={`mb-4 p-4 rounded-lg ${getScoreBgColor(qualityScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Score:</span>
                <span className={`text-3xl font-bold ${getScoreColor(qualityScore)}`}>
                  {qualityScore}
                </span>
              </div>

              {/* Visual Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getScoreBarColor(qualityScore)}`}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>

            {/* Slider Input */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={qualityScore}
              onChange={(e) => setQualityScore(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Score Markers */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 (Poor)</span>
              <span>41 (Standard)</span>
              <span>71 (Premium)</span>
              <span>100 (Excellent)</span>
            </div>
          </div>

          {/* Quality Grade */}
          <div>
            <label htmlFor="qualityGrade" className="block text-sm font-semibold text-gray-700 mb-2">
              Quality Grade *
            </label>
            <select
              id="qualityGrade"
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Premium">Premium (71-100)</option>
              <option value="Standard">Standard (41-70)</option>
              <option value="Feed">Feed (0-40)</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Auto-suggested based on quality score
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Inspection Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Inspection notes, observations, recommendations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Photo Upload (Stub) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium mb-1">Photo Upload Coming Soon</p>
                <p className="text-xs text-gray-500">
                  This feature will be available in a future update
                </p>
              </div>
              <input
                type="file"
                disabled
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Completed
                </>
              ) : (
                'Submit Results'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
