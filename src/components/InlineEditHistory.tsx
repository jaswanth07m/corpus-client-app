import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';

interface FieldChange {
  old_value: string | number | boolean | null | undefined;
  new_value: string | number | boolean | null | undefined;
}

interface EditHistoryEntry {
  uid: string;
  version_number: number;
  created_at: string;
  changed_by?: string;
  change_type?: string;
  change_source?: string;
  field_changes?: Record<string, FieldChange>;
}

interface InlineEditHistoryProps {
  recordId: string;
  token: string;
}

export const InlineEditHistory: React.FC<InlineEditHistoryProps> = ({
  recordId,
  token,
}) => {
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_URL}/history/record/${recordId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error('Failed to fetch edit history');
        }
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [recordId, token]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-md font-semibold text-gray-700 mb-2">Edit History</h4>
      {loading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}
      {!loading && !error && history.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No edit history found for this record.
        </p>
      )}
      {!loading && !error && history.length > 0 && (
        <ul className="space-y-2">
          {history.map((entry) => {
            const isExpanded = expandedEntry === entry.uid;
            return (
              <li
                key={entry.uid}
                className="border rounded-lg overflow-hidden bg-white"
              >
                <button
                  onClick={() =>
                    setExpandedEntry(isExpanded ? null : entry.uid)
                  }
                  className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">
                      Version {entry.version_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleString()} by{' '}
                      <span className="font-medium">
                        {entry.changed_by || 'N/A'}
                      </span>
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronUp size={20} />
                  )}
                </button>
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                      <p>
                        <strong className="text-gray-600">Change Type:</strong>{' '}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          {entry.change_type || 'N/A'}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-600">
                          Change Source:
                        </strong>{' '}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          {entry.change_source || 'N/A'}
                        </span>
                      </p>
                    </div>
                    {entry.field_changes &&
                      Object.keys(entry.field_changes).length > 0 && (
                        <div>
                          <strong className="text-base font-semibold text-gray-700">
                            Field Changes:
                          </strong>
                          <ul className="mt-2 space-y-2">
                            {Object.entries(entry.field_changes).map(
                              ([field, change]) => (
                                <li
                                  key={field}
                                  className="p-2 border rounded-md bg-gray-50"
                                >
                                  <strong className="font-semibold text-gray-800">
                                    {formatFieldName(field)}
                                  </strong>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs font-medium text-red-500 mr-2">
                                      OLD:
                                    </span>
                                    <span className="font-mono text-sm text-red-700 bg-red-50 p-1 rounded line-through">
                                      {String(change.old_value ?? 'N/A')}
                                    </span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs font-medium text-green-500 mr-2">
                                      NEW:
                                    </span>
                                    <span className="font-mono text-sm text-green-700 bg-green-50 p-1 rounded">
                                      {String(change.new_value ?? 'N/A')}
                                    </span>
                                  </div>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
