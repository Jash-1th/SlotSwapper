import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import IncomingRequestCard from '../components/IncomingRequestCard';
import OutgoingRequestCard from '../components/OutgoingRequestCard';

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

  const navigate = useNavigate();

  const handleAccept = async (requestId) => {
    try {
      setLoading(true);
      await api.post(`/swap-response/${requestId}`, { acceptance: true });
      toast.success('Swap request accepted! Events have been swapped.');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to accept request';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      await api.post(`/swap-response/${requestId}`, { acceptance: false });
      toast.success('Swap request rejected.');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject request';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Swap Requests</h1>
          <button
            className="button outline"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="requests-container">
        <section className="requests-section">
          <h2 className="section-title">Incoming Requests</h2>
          {incomingRequests.length === 0 ? (
            <div className="empty-state">
              <p>No incoming swap requests</p>
            </div>
          ) : (
            <div className="requests-grid">
              {incomingRequests.map((request) => (
                <IncomingRequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </section>

        <section className="requests-section">
          <h2 className="section-title">Outgoing Requests</h2>
          {outgoingRequests.length === 0 ? (
            <div className="empty-state">
              <p>No outgoing swap requests</p>
            </div>
          ) : (
            <div className="requests-grid">
              {outgoingRequests.map((request) => (
                <OutgoingRequestCard
                  key={request._id}
                  request={request}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Requests;
