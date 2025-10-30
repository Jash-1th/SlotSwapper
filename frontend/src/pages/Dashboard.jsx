import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const { logout, user, loading: authLoading, socket } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      // Fetch events
      const eventsResponse = await api.get('/events/my-events');
      setEvents(eventsResponse.data);
      
      // Fetch incoming swap requests
      const requestsResponse = await api.get('/swap-requests/incoming');
      setNotificationCount(requestsResponse.data.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  // Set up socket event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      console.log('--- Dashboard LISTENER: Setting up socket listeners...');

      const handleRefreshData = (data) => {
        console.log('--- Dashboard LISTENER: Received event, refreshing data!', {
          event: data?.type || 'unknown_event',
          timestamp: new Date().toISOString(),
          data: data
        });
        fetchData();
      };

     
      socket.on('new_swap_request', handleRefreshData);
      socket.on('swap_response', handleRefreshData);

     
      return () => {
        console.log('--- Dashboard LISTENER: Cleaning up socket listeners');
        socket.off('new_swap_request', handleRefreshData);
        socket.off('swap_response', handleRefreshData);
      };
    }
  }, [socket, fetchData]); 

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/events', {
        title,
        startTime,
        endTime,
      });

      setTitle('');
      setStartTime('');
      setEndTime('');
      
      
      toast.success('Event created successfully!');
      
      
      await fetchData();
    } catch (error) {
      console.error('Create event error:', error);
      if (error.data && error.data.message) {
        
        toast.error(error.data.message);
        setError(error.data.message);
      } else {
      
        const errorMessage = error.response?.data?.message || 'Event creation failed. Please check the times.';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await api.put(`/events/${eventId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <button
            className="button outline"
            onClick={() => navigate('/marketplace')}
            aria-label="Go to Marketplace"
          >
            <span>📋</span> Marketplace
          </button>
        </div>
        <div className="header-right">
          <span className="text-secondary">
            {authLoading ? 'Loading...' : `👋 Welcome, ${user?.name || 'User'}`}
          </span>
          <button
            className="button danger"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </header>
      
      {notificationCount > 0 && (
        <button 
          className="notification-banner"
          onClick={() => navigate('/requests')}
          aria-label="View notifications"
        >
          <span>🔔</span>
          You have {notificationCount} new swap request{notificationCount !== 1 ? 's' : ''}
          <span className="ml-2">View &rarr;</span>
        </button>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2>Create New Event</h2>
          <span className="text-secondary">Step 1 of 2</span>
        </div>
        <form onSubmit={handleCreateEvent}>
          <div className="form-group">
            <label htmlFor="title">Event Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="E.g., Team Meeting, Doctor's Appointment"
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-group">
              <label htmlFor="startTime">
                <span className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Start Time</span>
                </span>
              </label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={localDateTime}
                required
                className="w-full"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">
                <span className="flex items-center gap-2">
                  <span>⏰</span>
                  <span>End Time</span>
                </span>
              </label>
              <input
                type="datetime-local"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime || localDateTime}
                required
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {error && (
              <p className="text-error flex-1">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            )}
            <button
              type="submit"
              className={`button primary ${loading ? 'opacity-75' : ''} w-full sm:w-auto`}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <span>📅</span>
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-40">
        <div className="flex justify-between items-center mb-6">
          <h2>My Events</h2>
          <span className="text-secondary">{events.length} event{events.length !== 1 ? 's' : ''} total</span>
        </div>
        
        {events.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl mb-2">No events yet</h3>
            <p className="text-secondary max-w-md mx-auto">
              You haven't created any events. Click the button above to schedule your first event!
            </p>
          </div>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <div className="flex justify-between items-start">
                  <h3 className="truncate">{event.title}</h3>
                  <span className={`status ${event.status === 'SWAPPABLE' ? 'available' : 'unavailable'}`}>
                    {event.status === 'SWAPPABLE' ? '✅ Available' : '⏳ Unavailable'}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <p title={new Date(event.startTime).toLocaleString()}>
                    <span className="text-secondary">📅</span>
                    <span className="ml-2">{formatLocalDate(event.startTime)}</span>
                  </p>
                  <p title={new Date(event.endTime).toLocaleString()}>
                    <span className="text-secondary">⏰</span>
                    <span className="ml-2">{formatLocalDate(event.endTime)}</span>
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border-color">
                  {event.status === 'BUSY' && (
                    <button
                      className="button outline w-full"
                      onClick={() => handleStatusChange(event._id, 'SWAPPABLE')}
                    >
                      <span>🔄</span>
                      Make Available
                    </button>
                  )}
                  {event.status === 'SWAPPABLE' && (
                    <button
                      className="button outline w-full"
                      onClick={() => handleStatusChange(event._id, 'BUSY')}
                    >
                      <span>⏸️</span>
                      Mark as Unavailable
                    </button>
                  )}
                  {event.status === 'SWAP_PENDING' && (
                    <div className="text-center py-2 px-3 bg-yellow-500/10 rounded text-yellow-400 text-sm">
                      <span className="inline-block mr-2">🔒</span>
                      Pending swap request
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
