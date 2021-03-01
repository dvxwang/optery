const cheerio = require('cheerio')
const axios = require('axios')
const url = require('url');

const parserMapping = {
  'www.instantcheckmate.com': instantCheckmateParser
};

const testUrls = [
  'https://www.instantcheckmate.com/results?firstName=Xiao&middleInitial=&lastName=Wang&city=Boston&state=MA&age=30',
];

const runner = async(urls) => {

  const masterList = {};

  for(let i = 0; i<urls.length; i++){
    const url = urls[i];
    await axios.get(url)
    .then((response) => {
      const parser = parserMapping[getDomain(url)];
      const results = parser(response);

      if(results.identities.length){
        results.identities.forEach(profile => {
          let _idString = profile.firstName + '<>' + profile.middleName + '<>' + profile.lastName + '<>' + profile.age;
          if(!(_idString in masterList)){
            masterList[_idString] = [];
          }
          masterList[_idString].push(results.name);
        });
      }
      return true;
    })
  };

  console.log('David: ', masterList);
}

runner(testUrls);

// Helper functions

// #1.
function getDomain(url){
  const _url = new URL(url);
  return _url.hostname;
}

// #2.
function parseName(name){
  name = name.trim();
  if(!name.length) return null;

  const splitName = name.split(' ');
  const nameLength = splitName.length;

  switch(nameLength){
    case 1:
      return {firstName: splitName[0]};
    case 2:
      return {
        firstName: splitName[0],
        lastName: splitName[1],
      };
    default:
      return {
        firstName: splitName[0],
        middleName: splitName.slice(1, nameLength - 1).join(' '),
        lastName: splitName[nameLength - 1],
      };
  }
}

// #3.
function parseAge(age){
  age = age.trim();
  age = age.replace(/\D/g,'');
  if(!age.length) return null;

  return +age;
}

// Site-specific parsers

// 'www.instantcheckmate.com'
function instantCheckmateParser(response){
  const $ = cheerio.load(response.data)
  const urlElems = $('.person')

  let identities = [];

  for (let i = 0; i < urlElems.length; i++) {
    const nameContainer = $(urlElems[i]).find('.category.name>h4')[0];
    const nameText = $(nameContainer).text();
    const name = parseName(nameText)

    const ageContainer = $(urlElems[i]).find('.category.age .display-age')[0];
    const ageText = $(ageContainer).text();
    const age = parseAge(ageText);
    
    identities.push({...name, age});
  }

  return {
    name: 'instantcheckmate',
    identities
  };
}

