require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const mongoose = require('mongoose');
const { analyzeMembers } = require('./utils/analyzeMembers');
const { TOKEN, GUILDID, MONGOURL } = process.env;
const { machineIdSync } = require('node-machine-id'); // Adicionado para obter o HWID
const admin = require('firebase-admin'); // Adicionado para usar Firebase Admin

// Configuração do Firebase Admin
const serviceAccount = require('./utils/key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Referência ao banco de dados Firestore

const colors = {
    blue: '\x1b[34m',
    red: '\x1b[31m',
    green: '\x1b[32m',
};

// Conectando ao MongoDB
mongoose.connect(MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Configurando o cliente do Discord
const client = new Client({ checkUpdate: false });

// Função para verificar o HWID no Firebase
async function verifyUser(hwid) {
  const snapshot = await db.collection('users').where('hwid', '==', hwid).get();
  if (snapshot.empty) {
    console.log('Não encontrei uma licença válida para o usuário!');
    return false;
  } else {
    console.log('Usuário verificado!');
    return true;
  }
}

client.on('ready', async () => {
    console.log(`${colors.red} Conectado ao usuário: ${client.user.username}`);
    const hwid = machineIdSync(); // Obter o HWID da máquina atual
    const isUserVerified = await verifyUser(hwid); // Verificar se o usuário está registrado

    if (isUserVerified) {
      analyzeMembers(client, GUILDID, TOKEN);
    } else {
      console.log('Sua máquina não está registrada, compre um acesso pelo discord: @pecaram' + `\n Informe seu HWID no momento da compra: ${hwid} `);
    }
});

client.login(TOKEN);

