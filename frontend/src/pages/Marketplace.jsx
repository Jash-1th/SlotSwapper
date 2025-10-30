import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatLocalDate, formatTime } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';

// Custom Modal Component
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const Marketplace = () => {
  const navigate = useNavigate();
  const [swappableSlots, setSwappableSlots] = useState([]);
  const [mySwappableEvents, setMySwappableEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMySlot, setSelectedMySlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSwappableSlots = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/swappable-slots');
      setSwappableSlots(response.data);
    } catch (error) {
      console.error('Error fetching swappable slots:', error);
      toast.error('Failed to load swappable slots');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSwappableSlots();
  }, []);

  const handleRequestSwap = async (slot) => {
    setSelectedSlot(slot);
    setError('');
    setSelectedMySlot(null);
    
    try {
      setLoading(true);
      const response = await api.get('/events/my-events');
      const swappable = response.data.filter((event) => event.status === 'SWAPPABLE');
      setMySwappableEvents(swappable);
      setIsModalOpen(true);
      
      if (swappable.length === 0) {
        setError('You have no swappable slots. Mark an event as available first.');
      }
    } catch (error) {
      console.error('Error fetching my events:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load your available slots';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!selectedMySlot) {
      toast.error('Please select one of your slots to offer');
      return;
    }

    setLoading(true);

    try {
      await api.post('/swap-request', {
        mySlotId: selectedMySlot,
        theirSlotId: selectedSlot._id,
      });

      toast.success('Swap request sent successfully!');
      setIsModalOpen(false);
      setSelectedMySlot('');
      fetchSwappableSlots();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send swap request';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (!loading) {
      setIsModalOpen(false);
      setSelectedSlot(null);
      setSelectedMySlot(null);
      setError('');
    }
  };

  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Marketplace</h1>
          <button
            className="button outline"
            onClick={navigateToDashboard}
            aria-label="Back to Dashboard"
          >
            <span>←</span> Back to Dashboard
          </button>
        </div>
        <div className="header-right">
          <span className="text-secondary">
            {swappableSlots.length} available slot{swappableSlots.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <p className="text-secondary mb-6">Browse and request to swap time slots with other users</p>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : swappableSlots.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🕒</div>
          <h3 className="text-xl mb-2">No available slots</h3>
          <p className="text-secondary max-w-md mx-auto">
            There are currently no slots available for swapping. Check back later!
          </p>
        </div>
      ) : (
        <div className="marketplace-grid">
          {swappableSlots.map((slot) => (
            <div key={slot._id} className="event-card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-medium text-primary truncate">{slot.title}</h3>
                <span className="status available">
                  ✅ Available
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-secondary mb-1">
                  <span className="inline-block w-16">Owner:</span>
                  <span className="font-medium text-primary">{slot.owner?.name || 'Unknown User'}</span>
                </p>
                <p className="text-sm text-secondary mb-1">
                  <span className="inline-block w-16">Email:</span>
                  <span className="text-primary">{slot.owner?.email || 'Not provided'}</span>
                </p>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="text-secondary">📅</span>
                  <span className="ml-2">{formatLocalDate(slot.startTime)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-secondary">⏰</span>
                  <span className="ml-2">{formatLocalDate(slot.endTime)}</span>
                </p>
              </div>
              
              <button
                onClick={() => handleRequestSwap(slot)}
                className="button primary w-full mt-auto"
                aria-label={`Request to swap ${slot.title} slot`}
              >
                <span>🔄</span> Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title="Request Swap"
        footer={
          <>
            <button
              onClick={closeModal}
              type="button"
              className="button outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSwap}
              type="button"
              className="button primary"
              disabled={loading || !selectedMySlot || mySwappableEvents.length === 0}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </>
        }
      >
        {selectedSlot && (
          <div className="bg-bg-tertiary p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-secondary mb-2">Their Slot</h3>
            <h4 className="text-lg font-medium text-primary mb-2">{selectedSlot.title}</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-secondary w-20">Date:</span>
                <span className="text-primary">
                  {new Date(selectedSlot.startTime).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-secondary w-20">Time:</span>
                <span className="text-primary">
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-secondary w-20">Owner:</span>
                <span className="text-primary">{selectedSlot.owner?.name || 'Unknown User'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="slot-selection">
          <h3>Select Your Slot to Offer</h3>
          
          {mySwappableEvents.length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-lg">
              <p className="flex items-center">
                <span className="mr-2">ℹ️</span>
                You have no swappable slots.
              </p>
              <p className="mt-2 text-sm">
                Mark one of your events as "Available" in your dashboard first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySwappableEvents.map((event) => (
                <label 
                  key={event._id}
                  className={`slot-option ${selectedMySlot === event._id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="mySlot"
                    value={event._id}
                    checked={selectedMySlot === event._id}
                    onChange={() => setSelectedMySlot(event._id)}
                    className="hidden"
                  />
                  <div className="slot-info">
                    <span className="slot-title">{event.title}</span>
                    <span className="slot-time">
                      {new Date(event.startTime).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mt-4">
            <p className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Marketplace;
