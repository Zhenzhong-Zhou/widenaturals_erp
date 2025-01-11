import { getAllStatuses } from '../repositories/status-repository';

const fetchStatuses = async () => {
  const page = 2;
  const limit = 5;

  try {
    const { data, pagination } = await getAllStatuses(page, limit);
    console.log('Statuses:', data);
    console.log('Pagination Info:', pagination);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

module.exports = { fetchStatuses };
