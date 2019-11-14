const functions = require('firebase-functions');

exports.checkForNotification = functions.firestore.document('Usina/{idUsina}').onWrite((change, context) => {
  console.log(`Some change has been made to Usina/${context.params.idUsina}`);
  console.log('Data:');
  const data = change.after.data();
  console.log(JSON.stringify(data, null, 2));
  // Implement notifications logic here using data as input
});

exports.addHistory = functions.firestore.document('Usina/{idUsina}').onUpdate((change, context) => {
  console.log('Saving power plant data to history');
  const datetime = new Date();
  const data = change.before.data();
  console.log(JSON.stringify(data, null,2));
  console.log(`Date: ${datetime}`);
  // Implement history logic here using data as input
});
