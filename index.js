const xlsx = require('node-xlsx').default;
const fs = require('fs');
const axios = require('axios'); 
const converter = require('json-2-csv');
const API = "https://www.receitaws.com.br/v1/cnpj/";

async function getData (cnpj) {
  // DADOS EXEMPLO API
  // return {
  //   "atividade_principal": [
  //     {
  //       "text": "Sociedade seguradora de seguros não vida",
  //       "code": "65.12-0-00"
  //     }
  //   ],
  //   "data_situacao": "03/11/2005",
  //   "nome": "SOMPO SEGUROS S.A.",
  //   "uf": "SP",
  //   "telefone": "(11) 3156-1000",
  //   "email": "fiscalizacao@sompo.com.br",
  //   "atividades_secundarias": [
  //     {
  //       "text": "Sociedade seguradora de seguros vida",
  //       "code": "65.11-1-01"
  //     }
  //   ],
  //   "qsa": [
  //     {
  //       "qual": "16-Presidente",
  //       "nome": "FRANCISCO CAIUBY VIDIGAL FILHO"
  //     },
  //     {
  //       "qual": "10-Diretor",
  //       "nome": "SVEN ROBERT WILL"
  //     },
  //     {
  //       "qual": "10-Diretor",
  //       "nome": "ADAILTON OLIVEIRA DIAS"
  //     },
  //     {
  //       "qual": "08-Conselheiro de Administração",
  //       "nome": "ARLINDO DA CONCEICAO SIMOES FILHO"
  //     },
  //     {
  //       "qual": "10-Diretor",
  //       "nome": "ATSUSHI YASUDA"
  //     },
  //     {
  //       "qual": "10-Diretor",
  //       "nome": "FERNANDO ANTONIO GROSSI CAVALCANTE"
  //     }
  //   ],
  //   "situacao": "ATIVA",
  //   "bairro": "VILA MARIANA",
  //   "logradouro": "R CUBATAO",
  //   "numero": "320",
  //   "cep": "04.013-001",
  //   "municipio": "SAO PAULO",
  //   "porte": "DEMAIS",
  //   "abertura": "28/07/1966",
  //   "natureza_juridica": "205-4 - Sociedade Anônima Fechada",
  //   "cnpj": "61.383.493/0001-80",
  //   "ultima_atualizacao": "2019-08-15T18:54:15.468Z",
  //   "status": "OK",
  //   "tipo": "MATRIZ",
  //   "fantasia": "",
  //   "complemento": "",
  //   "efr": "",
  //   "motivo_situacao": "",
  //   "situacao_especial": "",
  //   "data_situacao_especial": "",
  //   "capital_social": "985585652.35",
  //   "extra": {},
  //   "billing": {
  //     "free": true,
  //     "database": true
  //   }
  // }
  let numbers = cnpj.replace( /\D/g, '')
  return await axios.get(API + numbers)
  .then(function (response) {
    return response.data
  })
  .catch(function (error) {
    console.log('RESPONSE ERROR', error)
    return false
  });
}

function parseData(row,data){
  return {
    "CODIGO": row[0],
    "CNPJ": row[1],
    "NOME": data.nome || '',
    "TELEFONE": data.telefone  || '',
    "SITUACAO": data.situacao || '',
    "LOGRADOURO": data.logradouro || ''
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processData() {
  if(!process.argv[2]) { 
    console.log('Precisa definir o arquivo xlsx')
    return false
  }
  console.log('Procurando arquivo', process.argv[2])
  let file = process.argv[2].split('.')
  let fileCSV = file[0] + '_process_'+ Date.now() + '.csv';

  const workSheetsFromFile = xlsx.parse(`${__dirname}/${process.argv[2]}`);
  var data = []
  var total = workSheetsFromFile[0].data.length
  for (var index=1; index<total; index++){
     
      let row = workSheetsFromFile[0].data[index]
      console.log(`Processando[${row[0]}][${row[1]}]: Iniciando Busca ${index} / ${total}`)
      let item = await parseData(row,await getData(row[1]))
      console.log(`Processando[${row[0]}][${row[1]}]: Dados Processados`)
      console.log(JSON.stringify(item,null,2))
      converter.json2csv([item], (err, csv) => {
        fs.appendFileSync(`${__dirname}/${fileCSV}`, csv + '\n', 'utf8');
      },{
      delimiter: {
        field:';',
        wrap: '"',
        eol: '\n',
      },
      prependHeader: false
    });
    console.log(`Esperando 35seg`)
    await sleep(35000);
    
  }
}

processData()