import { formatTime } from '../utils/dateUtils';

const IncomingRequestCard = ({ request, onAccept, onReject, loading = false }) => {
  return (
    <div className="request-card">
      <div className="request-card__header">
        <h3 className="request-card__title">Swap Request from {request.requester?.name || 'User'}</h3>
        <span className={`status-badge ${request.status?.toLowerCase()}`}>
          {request.status || 'Pending'}
        </span>
      </div>
      
      <div className="request-card__content">
        <div className="slot-comparison">
          <div className="slot-sheet">
            <h4 className="slot-sheet__title">Their Offer</h4>
            <div className="slot-details">
              <p className="slot-details__title">{request.offeredSlot?.title || 'No title'}</p>
              <p className="slot-details__time">
                {new Date(request.offeredSlot?.startTime).toLocaleDateString()}
              </p>
              <p className="slot-details__time">
                {formatTime(request.offeredSlot?.startTime)} - {formatTime(request.offeredSlot?.endTime)}
              </p>
            </div>
          </div>
          
          <div className="slot-separator">
            <span>⇄</span>
          </div>
          
          <div className="slot-sheet">
            <h4 className="slot-sheet__title">Your Slot</h4>
            <div className="slot-details">
              <p className="slot-details__title">{request.requestedSlot?.title || 'No title'}</p>
              <p className="slot-details__time">
                {new Date(request.requestedSlot?.startTime).toLocaleDateString()}
              </p>
              <p className="slot-details__time">
                {formatTime(request.requestedSlot?.startTime)} - {formatTime(request.requestedSlot?.endTime)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="request-card__footer">
        <button
          className="button danger"
          onClick={() => onReject(request._id)}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Reject'}
        </button>
        <button
          className="button success"
          onClick={() => onAccept(request._id)}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Accept'}
        </button>
      </div>
    </div>
  );
};

export default IncomingRequestCard;
