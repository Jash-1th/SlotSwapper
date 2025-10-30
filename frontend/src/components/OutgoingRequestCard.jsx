import { formatTime } from '../utils/dateUtils';

const OutgoingRequestCard = ({ request }) => {
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
      default:
        return 'warning';
    }
  };

  return (
    <div className="request-card">
      <div className="request-card__header">
        <h3 className="request-card__title">
          Swap request to {request.recipient?.name || 'User'}
        </h3>
        <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
          {request.status || 'Pending'}
        </span>
      </div>
      
      <div className="request-card__content">
        <div className="slot-comparison">
          <div className="slot-sheet">
            <h4 className="slot-sheet__title">Your Offer</h4>
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
            <h4 className="slot-sheet__title">Their Slot</h4>
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
    </div>
  );
};

export default OutgoingRequestCard;
