const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const { createAddressService } = require('../services/address-service');

const createAddressController = wrapAsync(async (req, res) => {
  const addresses = req.body;
  const user = req.user;
  
  logInfo('Creating address record(s)', req, {
    context: 'address-controller/createAddressController',
    recordCount: addresses.length,
    requestedBy: user.id,
    requestId: req.id,
    traceId: req.traceId,
  });
  
  const result = await createAddressService(addresses, user);
  
  res.status(201).json({
    success: true,
    message:
      addresses.length > 1
        ? 'Bulk addresses created successfully.'
        : 'Address created successfully.',
    data: addresses.length > 1 ? result : result[0],
  });
});

module.exports = {
  createAddressController,
};
