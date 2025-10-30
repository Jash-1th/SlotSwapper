import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatLocalDate } from '../utils/dateUtils';

const Marketplace = () => {
  const [swappableSlots, setSwappableSlots] = useState([]);
  const [mySwappableEvents, setMySwappableEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMySlot, setSelectedMySlot] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSwappableSlots = async () => {
    try {
      const response = await api.get('/swappable-slots');
      setSwappableSlots(response.data);
    } catch (error) {
      console.error('Error fetching swappable slots:', error);
    }
  };

  useEffect(() => {
    fetchSwappableSlots();
  }, []);

  const handleRequestSwap = async (slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
    setMessage('');

    try {
      const response = await api.get('/events/my-events');
      const swappable = response.data.filter((event) => event.status === 'SWAPPABLE');
      setMySwappableEvents(swappable);
    } catch (error) {
      console.error('Error fetching my events:', error);
    }
  };

  const handleConfirmSwap = async () => {
    if (!selectedMySlot) {
      setMessage('Please select one of your slots to offer');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/swap-request', {
        mySlotId: selectedMySlot,
        theirSlotId: selectedSlot._id,
      });

      setMessage('Swap request sent successfully!');
      setIsModalOpen(false);
      setSelectedMySlot('');
      fetchSwappableSlots();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send swap request');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setSelectedMySlot('');
    setMessage('');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Marketplace</h1>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back to Dashboard
            </button>
          </Link>
        </div>
        <p style={{ color: '#e0e0e0' }}>Browse available slots from other users</p>
      </div>

      {message && !isModalOpen && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

      <div>
        {swappableSlots.length === 0 ? (
          <p>No swappable slots available at the moment.</p>
        ) : (
          <div>
            {swappableSlots.map((slot) => (
              <div
                key={slot._id}
                style={{
                  padding: '15px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#333'
                }}
              >
                <h3 style={{ color: '#000' }}>{slot.title}</h3>
                <p>
                  <strong>Owner:</strong> {slot.owner.name} ({slot.owner.email})
                </p>
                <p>
                  <strong>Start:</strong> {formatLocalDate(slot.startTime)}
                </p>
                <p>
                  <strong>End:</strong> {formatLocalDate(slot.endTime)}
                </p>
                <button
                  onClick={() => handleRequestSwap(slot)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '10px',
                  }}
                >
                  Request Swap
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2 style={{ color: '#000' }}>Request Swap</h2>
        {selectedSlot && (
          <div style={{ marginBottom: '20px', color: '#333' }}>
            <h3 style={{ color: '#000' }}>Their Slot:</h3>
            <p>
              <strong>{selectedSlot.title}</strong>
            </p>
            <p>
              {formatLocalDate(selectedSlot.startTime)} - {formatLocalDate(selectedSlot.endTime)}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000' }}>Select Your Slot to Offer:</h3>
          {mySwappableEvents.length === 0 ? (
            <p style={{ color: '#dc3545' }}>
              You have no swappable slots. Please mark one of your events as swappable first.
            </p>
          ) : (
            <select
              value={selectedMySlot}
              onChange={(e) => setSelectedMySlot(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                marginTop: '10px',
              }}
            >
              <option value="">-- Select a slot --</option>
              {mySwappableEvents.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} ({formatLocalDate(event.startTime)})
                </option>
              ))}
            </select>
          )}
        </div>

        {message && (
          <div style={{ color: 'red', marginBottom: '15px' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleConfirmSwap}
            disabled={loading || mySwappableEvents.length === 0}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              cursor: loading || mySwappableEvents.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Confirm Swap'}
          </button>
          <button
            onClick={closeModal}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Marketplace;
