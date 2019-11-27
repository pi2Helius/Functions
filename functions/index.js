const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.handlePowerPlantStatus = functions.firestore.document('usinas/{idUsina}')
  .onWrite(async (change, context) => {

  const powerPlantId = context.params.idUsina;
  const data = change.after.data();
  const notificationCollectionRef = db.collection(`usinas/${powerPlantId}/notificacoes`);

  const statusDocumentRef = db.doc(`usinas/${powerPlantId}/estados/1`);

  let statusData;
  await statusDocumentRef.get().then(async (statusSnap) => {
    if(statusSnap.exists) {
      statusData = await statusSnap.data();
      return statusData;
    } else {
      statusData = {
        ROT: 'normal',
        TEMP_PQUENTE: 'normal',
      }
      return statusDocumentRef.create(statusData);
    }
  }) 

  // Atualizar estado das rotações
  const nRotations = data.ROT;
  let rotationStatus;
  if(nRotations <= 0) {
    rotationStatus = 'parado';
  } else if(nRotations > 0 && nRotations <= 90) {
    rotationStatus = 'baixo';
  } else if(nRotations > 90 && nRotations <= 580) {
    rotationStatus = 'normal';
  } else {
    rotationStatus = 'alto';
  }

  if(rotationStatus !== statusData.ROT) {
    await statusDocumentRef.set({ROT: rotationStatus}, { merge: true });
    if(rotationStatus === 'alto') {
      const notification = {
        dataDeCriacao: new Date(),
        descricao: `O motor está operando em ${nRotations} rpm, o que configura um nível alto.`,
        parametro: 'ROT',
      }

      await notificationCollectionRef.add(notification);
    }
    console.log(`Alterando status de rotação de ${statusData.ROT} para ${rotationStatus}`);
  }

  // Atualizar estado da temperatura
  const temperature = data.TEMP_PQUENTE;
  let temperatureStatus;
  if(temperature < 180) {
    temperatureStatus = 'baixo';
  } else if(temperature >= 180 && temperature < 580) {
    temperatureStatus = 'normal';
  } else {
    temperatureStatus = 'alto';
  }

  if(temperatureStatus !== statusData.TEMP_PQUENTE) {
    await statusDocumentRef.set({TEMP_PQUENTE: temperatureStatus}, { merge: true });
    console.log(`A temperatura do pistão quente alcançou um temperatura de ${temperature}, o que configura um nível ${temperatureStatus}.`)
    if(temperatureStatus === 'alto') {
      const notification = {
        datetime: new Date(),
        descricao: `Temperatura no pistão quente alcançou ${temperature}ºC, o que configura um nível alto.`,
        parametro: 'TEMP_PQUENTE',
      }

      await notificationCollectionRef.add(notification);
    }
  }
});

exports.addHistory = functions.firestore.document('usinas/{idUsina}').onWrite((change, context) => {
  console.log('Saving power plant data to history');
  const idDaUsina = context.params.idUsina;
  const data = new Date();
  const dados = change.after.data();
  dados.data = data;

  const refDoHistorico = `usinas/${idDaUsina}/historico`;

  const historicoDaUsina = db.collection(refDoHistorico);
  console.log(historicoDaUsina);
  return historicoDaUsina.add(dados);
}); 
