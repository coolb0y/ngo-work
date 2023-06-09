const router = require('express').Router();
const fs = require('fs');
const path = require('path');
var JSONStream = require('JSONStream');
const { MeiliSearch } = require('meilisearch');

router.get('/', (req, res) => {
 
  try{
    let jsonpath = req.query.jsonpath;
    const indexname = req.query.indexname;

    const client = new MeiliSearch({
      host: "http://localhost:7700"
      // apiKey: "your_master_api_key_here"
    });
    console.log(jsonpath);
    console.log(indexname);

    client.index(indexname).updateSettings({
    
      distinctAttribute: 'url',
      searchableAttributes: [
          'title',
          'fileDetails',
          'artist',
          'album',
          
      ],
      filterableAttributes: ['fileType','fileSize','duration','width','baseurl'],
      typoTolerance: {
          'minWordSizeForTypos': {
              'oneTypo': 7,
              'twoTypos': 12
          }
      },
      pagination: {
          maxTotalHits: 500
      },
      faceting: {
          maxValuesPerFacet: 20
      }
  })
    jsonpath = jsonpath.replace(/\\/g, '/');
    
    const highWaterMark = 1024 * 50; //50mb
    const readStream = fs.createReadStream(jsonpath, { highWaterMark, encoding: 'utf-8' });
    
    const parser = JSONStream.parse('*');
    
    parser.on('data', (data) => {
      // Index each document as it is parsed
      client.index(indexname).addDocuments(data)
        .then(result =>{ 
          console.log(result)
        })
        .catch(err => {
          console.error(err);
        });
    });
    
    parser.on('error', (err) => {
      console.error(err);
      return res.status(500).send({
        message: 'Error parsing the JSON file'
      })
    });
    
    readStream.pipe(parser);
    
    readStream.on('error', (err) => {
      console.error(err);
      return res.status(500).send({
        message: 'Error reading the JSON file'
      })
    });
    
    readStream.on('end', () => {
      return res.status(200).send({
        message: 'Indexing has enqued successfully Please wait for few minutes'
      })
    });
    

  }
  catch(e){
    console.log(e);
  }
})

module.exports = router;
