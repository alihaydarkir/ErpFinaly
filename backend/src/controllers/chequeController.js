const Cheque = require('../models/Cheque');
const { logger } = require('../middleware/logger');
const Joi = require('joi');

// Validation schema for cheque
const chequeSchema = Joi.object({
  cheque_number: Joi.string().required().max(50),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('TRY'),
  issue_date: Joi.date().required(),
  due_date: Joi.date().required().min(Joi.ref('issue_date')),
  drawer_name: Joi.string().required().max(255),
  drawer_tax_number: Joi.string().max(50).allow(null, ''),
  bank_name: Joi.string().required().max(255),
  bank_branch: Joi.string().max(255).allow(null, ''),
  account_number: Joi.string().max(50).allow(null, ''),
  payee_name: Joi.string().max(255).allow(null, ''),
  type: Joi.string().valid('receivable', 'payable').default('receivable'),
  notes: Joi.string().allow(null, '')
});

// Update validation schema (all fields optional except ID)
const updateChequeSchema = Joi.object({
  amount: Joi.number().positive(),
  currency: Joi.string().length(3),
  issue_date: Joi.date(),
  due_date: Joi.date(),
  drawer_name: Joi.string().max(255),
  drawer_tax_number: Joi.string().max(50).allow(null, ''),
  bank_name: Joi.string().max(255),
  bank_branch: Joi.string().max(255).allow(null, ''),
  account_number: Joi.string().max(50).allow(null, ''),
  payee_name: Joi.string().max(255).allow(null, ''),
  type: Joi.string().valid('receivable', 'payable'),
  notes: Joi.string().allow(null, '')
});

// Status validation schema
const statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'deposited', 'cashed', 'bounced', 'cancelled').required(),
  notes: Joi.string().allow(null, '')
});

// Get all cheques
exports.getAllCheques = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const cheques = await Cheque.findAll(filters);

    logger.info('Cheques retrieved', {
      userId: req.user.id,
      count: cheques.length,
      filters
    });

    res.json({
      success: true,
      data: cheques,
      count: cheques.length
    });
  } catch (error) {
    logger.error('Error getting cheques:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cheques',
      error: error.message
    });
  }
};

// Get cheque by ID
exports.getChequeById = async (req, res) => {
  try {
    const { id } = req.params;
    const cheque = await Cheque.findById(id);

    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque not found'
      });
    }

    // Get transactions
    const transactions = await Cheque.getTransactions(id);

    logger.info('Cheque retrieved', {
      userId: req.user.id,
      chequeId: id
    });

    res.json({
      success: true,
      data: {
        ...cheque,
        transactions
      }
    });
  } catch (error) {
    logger.error('Error getting cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cheque',
      error: error.message
    });
  }
};

// Create cheque
exports.createCheque = async (req, res) => {
  try {
    // Validate input
    const { error, value } = chequeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if cheque number already exists
    const existingCheque = await Cheque.findByChequeNumber(value.cheque_number);
    if (existingCheque) {
      return res.status(400).json({
        success: false,
        message: 'Cheque number already exists'
      });
    }

    // Create cheque
    const cheque = await Cheque.create(value, req.user.id);

    logger.info('Cheque created', {
      userId: req.user.id,
      chequeId: cheque.id,
      chequeNumber: cheque.cheque_number,
      amount: cheque.amount
    });

    res.status(201).json({
      success: true,
      message: 'Cheque created successfully',
      data: cheque
    });
  } catch (error) {
    logger.error('Error creating cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cheque',
      error: error.message
    });
  }
};

// Update cheque
exports.updateCheque = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateChequeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if cheque exists
    const existingCheque = await Cheque.findById(id);
    if (!existingCheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque not found'
      });
    }

    // Don't allow updating if cheque is already cashed or cancelled
    if (['cashed', 'cancelled'].includes(existingCheque.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update cheque with status: ${existingCheque.status}`
      });
    }

    // Update cheque
    const updatedCheque = await Cheque.update(id, value, req.user.id);

    logger.info('Cheque updated', {
      userId: req.user.id,
      chequeId: id
    });

    res.json({
      success: true,
      message: 'Cheque updated successfully',
      data: updatedCheque
    });
  } catch (error) {
    logger.error('Error updating cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cheque',
      error: error.message
    });
  }
};

// Update cheque status
exports.updateChequeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = statusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if cheque exists
    const existingCheque = await Cheque.findById(id);
    if (!existingCheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['deposited', 'cancelled'],
      deposited: ['cashed', 'bounced'],
      cashed: [],
      bounced: ['pending'],
      cancelled: []
    };

    if (!validTransitions[existingCheque.status].includes(value.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${existingCheque.status} to ${value.status}`
      });
    }

    // Update status
    const updatedCheque = await Cheque.updateStatus(id, value.status, req.user.id, value.notes);

    logger.info('Cheque status updated', {
      userId: req.user.id,
      chequeId: id,
      oldStatus: existingCheque.status,
      newStatus: value.status
    });

    res.json({
      success: true,
      message: 'Cheque status updated successfully',
      data: updatedCheque
    });
  } catch (error) {
    logger.error('Error updating cheque status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cheque status',
      error: error.message
    });
  }
};

// Delete cheque
exports.deleteCheque = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if cheque exists
    const existingCheque = await Cheque.findById(id);
    if (!existingCheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque not found'
      });
    }

    // Only allow deletion if status is pending or cancelled
    if (!['pending', 'cancelled'].includes(existingCheque.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete cheque with status: ${existingCheque.status}`
      });
    }

    await Cheque.delete(id);

    logger.info('Cheque deleted', {
      userId: req.user.id,
      chequeId: id
    });

    res.json({
      success: true,
      message: 'Cheque deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cheque',
      error: error.message
    });
  }
};

// Get cheque statistics
exports.getChequeStatistics = async (req, res) => {
  try {
    const filters = {
      type: req.query.type
    };

    const statistics = await Cheque.getStatistics(filters);

    logger.info('Cheque statistics retrieved', {
      userId: req.user.id
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting cheque statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
};

// Get due cheques
exports.getDueCheques = async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const dueCheques = await Cheque.getDueCheques(days);

    logger.info('Due cheques retrieved', {
      userId: req.user.id,
      days,
      count: dueCheques.length
    });

    res.json({
      success: true,
      data: dueCheques,
      count: dueCheques.length
    });
  } catch (error) {
    logger.error('Error getting due cheques:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve due cheques',
      error: error.message
    });
  }
};
