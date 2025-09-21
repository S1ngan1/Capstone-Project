// Quick test to verify activityLogService methods exist
const { activityLogService } = require('./utils/activityLogService.ts');

console.log('Testing activityLogService methods:');
console.log('createFarmRequestNotification exists:', typeof activityLogService.createFarmRequestNotification === 'function');
console.log('createFarmManagementNotification exists:', typeof activityLogService.createFarmManagementNotification === 'function');
console.log('All methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(activityLogService)).filter(name => name !== 'constructor'));
