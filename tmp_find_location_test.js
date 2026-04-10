const { findLocation } = require('./locationModule.js');
(async () => {
  try {
    const data = await findLocation({ lat: 35.643042060344506, lon: 139.67365041795975 });
    console.log('OK', data && data.length);
  } catch (err) {
    console.error('ERROR', err.message);
    console.error(err.stack);
  }
})();
