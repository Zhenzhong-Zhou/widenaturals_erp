const chalk = require('chalk');

/**
 * Helper to run test cases without crashing the script
 */
const runTestCase = async (name, fn) => {
  const prefix = chalk.yellow(`[CASE: ${name}]`);
  
  try {
    
    console.log(`${prefix} ▶️ Running`);
    
    const result = await fn();
    
    console.log(`${prefix} ✅ Passed`);
    
    return {
      success: true,
      result
    };
    
  } catch (err) {
    
    console.log(`${prefix} ❌ Failed`);
    console.log(`${prefix} ${err.message}`);
    
    return {
      success: false,
      error: err
    };
  }
};

module.exports = {
  runTestCase,
};
