const cron = require('node-cron');
const Order = require('../models/Order');

/**
 * Fallback cron job to delete Order records older than 7 days where movedToHistoryAt is set.
 * Runs daily at midnight server time (00:00).
 */
const startOrderHistoryCleanupJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏳ [CRON] Starting OrderHistory cleanup job...');

    try {
      // Calculate the date exactly 7 days ago from right now
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Delete all records where the movedToHistoryAt date is strictly less than 7 days ago
      const result = await Order.deleteMany({
        movedToHistoryAt: { $lt: sevenDaysAgo }
      });

      console.log(`✅ [CRON] Successfully deleted ${result.deletedCount} old Order history records.`);
    } catch (error) {
      console.error('❌ [CRON] Error during Order history cleanup job:', error);
    }
  });

  console.log('🕒 Cron job for OrderHistory cleanup initialized.');
};

module.exports = startOrderHistoryCleanupJob;
