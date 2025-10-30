import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const { logout, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
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
  };

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
      fetchEvents();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create event');
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
    <div className="container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <h1>Dashboard</h1>
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Go to Marketplace
            </button>
          </div>
          <div>
            <span style={{ marginRight: '15px' }}>
              {authLoading ? 'Loading...' : `Welcome, ${user?.name || 'User'}`}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
        
        {notificationCount > 0 && (
          <div 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              textAlign: 'center',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
              width: '100%',
              margin: '0 auto'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            onClick={() => navigate('/requests')}
          >
            🔔 You have {notificationCount} new swap request{notificationCount !== 1 ? 's' : ''}! Click here to review them. 🔔
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd' }}>
        <h2>Create New Event</h2>
        <form onSubmit={handleCreateEvent}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="startTime" style={{ display: 'block', marginBottom: '5px' }}>
              Start Time
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              min={localDateTime}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="endTime" style={{ display: 'block', marginBottom: '5px' }}>
              End Time
            </label>
            <input
              type="datetime-local"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              min={startTime}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2>My Events</h2>
        {events.length === 0 ? (
          <p>No events yet. Create your first event above!</p>
        ) : (
          <div>
            {events.map((event) => (
              <div
                key={event._id}
                style={{
                  padding: '15px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  backgroundColor: event.status === 'SWAP_PENDING' ? '#f0f0f0' : 'white',
                  color: '#333',  // Dark gray color for better readability
                }}
              >
                <h3 style={{ color: '#000' }}>{event.title}</h3>
                <p>
                  <strong>Start:</strong> {formatLocalDate(event.startTime)}
                </p>
                <p>
                  <strong>End:</strong> {formatLocalDate(event.endTime)}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor:
                        event.status === 'BUSY'
                          ? '#ffc107'
                          : event.status === 'SWAPPABLE'
                          ? '#28a745'
                          : '#6c757d',
                      color: 'white',
                      borderRadius: '4px',
                    }}
                  >
                    {event.status}
                  </span>
                </p>
                {event.status === 'BUSY' && (
                  <button
                    onClick={() => handleStatusChange(event._id, 'SWAPPABLE')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '10px',
                    }}
                  >
                    Make Swappable
                  </button>
                )}
                {event.status === 'SWAPPABLE' && (
                  <button
                    onClick={() => handleStatusChange(event._id, 'BUSY')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffc107',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '10px',
                    }}
                  >
                    Make Busy
                  </button>
                )}
                {event.status === 'SWAP_PENDING' && (
                  <p style={{ color: '#6c757d', marginTop: '10px' }}>
                    🔒 This event is locked in a pending swap request
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
