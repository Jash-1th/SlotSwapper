import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Requests = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRequests = async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/swap-requests/incoming'),
        api.get('/swap-requests/outgoing'),
      ]);
      setIncomingRequests(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (requestId, acceptance) => {
    setLoading(true);
    setMessage('');

    try {
      await api.post(`/swap-response/${requestId}`, { acceptance });
      setMessage(
        acceptance
          ? 'Swap request accepted! Events have been swapped.'
          : 'Swap request rejected.'
      );
      fetchRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to respond to request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Swap Requests</h1>
        <Link to="/dashboard" style={{ color: '#007bff' }}>
          ← Back to Dashboard
        </Link>
      </div>

      {message && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: message.includes('accepted') ? '#d4edda' : '#f8d7da',
            color: message.includes('accepted') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('accepted') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <h2>Incoming Requests</h2>
        {incomingRequests.length === 0 ? (
          <p>No incoming swap requests.</p>
        ) : (
          <div>
            {incomingRequests.map((request) => (
              <div
                key={request._id}
                style={{
                  padding: '15px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                }}
              >
                <p>
                  <strong>{request.requester.name}</strong> wants to swap their{' '}
                  <strong>{request.offeredSlot.title}</strong> for your{' '}
                  <strong>{request.requestedSlot.title}</strong>
                </p>
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Their slot: {new Date(request.offeredSlot.startTime).toLocaleString()} -{' '}
                    {new Date(request.offeredSlot.endTime).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Your slot: {new Date(request.requestedSlot.startTime).toLocaleString()} -{' '}
                    {new Date(request.requestedSlot.endTime).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleResponse(request._id, true)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleResponse(request._id, false)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2>Outgoing Requests</h2>
        {outgoingRequests.length === 0 ? (
          <p>No outgoing swap requests.</p>
        ) : (
          <div>
            {outgoingRequests.map((request) => (
              <div
                key={request._id}
                style={{
                  padding: '15px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <p>
                  Your request to swap <strong>{request.offeredSlot.title}</strong> for{' '}
                  <strong>{request.requestedSlot.title}</strong> is{' '}
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ffc107',
                      color: 'white',
                      borderRadius: '4px',
                    }}
                  >
                    PENDING
                  </span>
                </p>
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Your slot: {new Date(request.offeredSlot.startTime).toLocaleString()} -{' '}
                    {new Date(request.offeredSlot.endTime).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Their slot: {new Date(request.requestedSlot.startTime).toLocaleString()} -{' '}
                    {new Date(request.requestedSlot.endTime).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Requested from: <strong>{request.receiver.name}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
