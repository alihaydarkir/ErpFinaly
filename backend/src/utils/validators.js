const Joi = require('joi');

/**
 * Validation schemas using Joi
 */

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'manager', 'user').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateUser: Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid('admin', 'manager', 'user')
  }).min(1)
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string().max(100).allow('', null),
    sku: Joi.string().max(100).required()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0),
    stock: Joi.number().integer().min(0),
    category: Joi.string().max(100).allow('', null),
    sku: Joi.string().max(100)
  }).min(1),

  updateStock: Joi.object({
    quantity: Joi.number().integer().min(0).required(),
    operation: Joi.string().valid('set', 'increment', 'decrement').default('set')
  })
};

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().required(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required()
      })
    ).min(1).required(),
    total_amount: Joi.number().min(0).required(),
    status: Joi.string().valid('pending', 'completed', 'cancelled').default('pending')
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'cancelled'),
    total_amount: Joi.number().min(0)
  }).min(1),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'cancelled').required()
  })
};

// Chat validation schemas
const chatSchemas = {
  message: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    context: Joi.object().optional()
  })
};

// RAG Knowledge validation schemas
const ragSchemas = {
  create: Joi.object({
    content: Joi.string().min(1).required(),
    metadata: Joi.object().default({}),
    embedding: Joi.array().items(Joi.number()).optional()
  }),

  search: Joi.object({
    query: Joi.string().min(1).required(),
    limit: Joi.number().integer().min(1).max(20).default(5),
    threshold: Joi.number().min(0).max(1).default(0.7)
  })
};

// Query parameter validation
const querySchemas = {
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),

  dateRange: Joi.object({
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date'))
  }),

  filters: Joi.object({
    category: Joi.string(),
    status: Joi.string(),
    search: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    lowStock: Joi.number().integer().min(0)
  })
};

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

module.exports = {
  userSchemas,
  productSchemas,
  orderSchemas,
  chatSchemas,
  ragSchemas,
  querySchemas,
  validate
};
