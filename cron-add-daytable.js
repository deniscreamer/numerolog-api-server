let request = require('request-promise-native');
let moment = require('moment');

const API_URL = 'http://api.numerolog-valeria.ru';

const requestOptions = {
  baseUrl: API_URL,
  uri: '',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'X-Requested-With': 'XMLHttpRequest',
    Referer: API_URL,
  },
  json: true,
};
request = request.defaults(requestOptions);
moment.locale('ru');

const usernameFromApi = 'admin';
const passwordFromApi = 'admin123';

main();

async function main() {
  let dayTables = await sendRequest('/daytable');
  let templateDayTable = await sendRequest('/templatedaytable');

  let newDate = moment(dayTables[dayTables.length - 1].date);

  do {
    newDate = newDate.add('1', 'days');
  } while (newDate.weekday() > 4); // only not weekend

  templateDayTable.date = newDate.format();
  templateDayTable.weekday = newDate.format('dddd');

  let response = await sendRequestPost('/daytable', templateDayTable);

  console.log(response);
}

function sendRequest(url) {
  return request(url)
    .then(res => res)
    .catch(err => {
      throw new Error('error: ' + err);
    });
}

function sendRequestPost(url, data) {
  return request
    .post(url, { resolveWithFullResponse: true, form: data })
    .auth(usernameFromApi, passwordFromApi, true)
    .then(res => res.body.id)
    .catch(err => {
      throw new Error('Error: ' + err);
    });
}
