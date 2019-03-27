let request = require('request-promise-native');
let moment = require('moment');
const fetch = require('node-fetch');

const API_URL = 'http://api.numerolog-valeria.ru';

const requestOptions = {
  baseUrl: API_URL,
  uri: '',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'X-Requested-With': 'XMLHttpRequest',
    Referer: API_URL,
  },
  json: true,
};
request = request.defaults(requestOptions);
moment.locale('ru');

const usernameFromApi = 'XXX';
const passwordFromApi = 'XXX';

const smsGateUsername = 'XXX';
const smsGatePassword = 'XXX';

main();
sendSmsNotification();

async function main() {
  let dayTables = await sendRequest('/daytable');
  let templateDayTable = await sendRequest('/templatedaytable');

  let newDate = moment(dayTables[dayTables.length - 1].date);

  /* do {
    newDate = newDate.add('1', 'days');
  } while (newDate.weekday() > 4); // only not weekend */

  newDate = newDate.add('1', 'days'); // all days on week

  templateDayTable.date = newDate.format('YYYY-MM-DD');
  templateDayTable.weekday = newDate.format('dddd');

  let response = await sendRequestPost('/daytable', templateDayTable);

  console.log(response);
}

async function sendSmsNotification() {
  const needDay = moment(moment.now()).add('1', 'days').format('DD.MM.YYYY');
  const toDay = moment(moment.now()).format('DD-MM-YYYY');

  let clientsNeedNotification = await sendRequest('/orders?dateread=' + needDay);
  if (clientsNeedNotification.length) {
    for await (client of clientsNeedNotification) {
      if (client.payed) {
        let smsTimeToSend = moment(toDay + ' ' + client.timeat, 'DD-MM-YYYY HH:mm');
        let smsTo = client.contacts;
        let smsMessage =
          `Здравствуйте! У Вас завтра консультация с нумерологом в ${client.timeat} по МСК. Подготовьте ручку и тетрадку.`;

        fetch(
            `https://smsc.ru/sys/send.php?login=${smsGateUsername}&psw=${smsGatePassword}&phones=${encodeURI(smsTo)}&time=${smsTimeToSend.format('DDMMYYHHmm')}&mes=${encodeURI(smsMessage)}`
            )
          .then(response => console.log('send to => ' + smsTo + ' => ' + smsTimeToSend.format('DDMMYYHHmm') + ' => ' +
            smsMessage));
      }
    }
  }
}

function sendRequest(url) {
  return request(url)
    .auth(usernameFromApi, passwordFromApi, true)
    .then(res => res)
    .catch(err => {
      throw new Error('error: ' + err);
    });
}

function sendRequestPost(url, data) {
  return request
    .post(url, {
      resolveWithFullResponse: true,
      form: data
    })
    .auth(usernameFromApi, passwordFromApi, true)
    .then(res => res.body.id)
    .catch(err => {
      throw new Error('Error: ' + err);
    });
}
