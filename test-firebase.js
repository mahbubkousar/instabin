// Simple test script to verify Firebase configuration
const { getDb } = require('./netlify/functions/firebase-utils');

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    const db = getDb();
    console.log('✅ Firebase connected successfully');
    
    // Test a simple read operation
    const testCollection = db.collection('pastes');
    const snapshot = await testCollection.limit(1).get();
    console.log(`✅ Firestore query successful. Found ${snapshot.size} documents`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testFirebase();