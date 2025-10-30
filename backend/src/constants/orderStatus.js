/**
 * Order Status Constants
 */
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

/**
 * Order Status Workflow
 * Defines which status transitions are allowed
 */
const ORDER_STATUS_WORKFLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [], // Final state
  refunded: []   // Final state
};

/**
 * Check if status transition is valid
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  if (!ORDER_STATUS_WORKFLOW[currentStatus]) {
    return false;
  }
  return ORDER_STATUS_WORKFLOW[currentStatus].includes(newStatus);
};

/**
 * Get all available order statuses
 */
const getAllStatuses = () => {
  return Object.values(ORDER_STATUS);
};

/**
 * Get next possible statuses for current status
 */
const getNextStatuses = (currentStatus) => {
  return ORDER_STATUS_WORKFLOW[currentStatus] || [];
};

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_WORKFLOW,
  isValidStatusTransition,
  getAllStatuses,
  getNextStatuses
};
