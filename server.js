const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  if (fs.existsSync('./output/retrieved.txt')){
    res.render('index', { error: 0 });
  }
  else {
    fs.writeFileSync('./output/retrieved.txt', '')
    res.render('index', { error: 0 });
  }
})

// put your own api bearer here
let BEARER = '===============PASTE YOUR BEARER HERE====================';

let parser = (req, res, next) => {
  let postConfig = {
    method: 'get',
    url: `https://api.twitter.com/2/tweets/${req.body.id}?tweet.fields=created_at,source,author_id,entities&expansions=attachments.media_keys&media.fields=duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text`,
    headers: { 
      'Authorization': `Bearer ${BEARER}`, 
      'Cookie': 'guest_id=v1%3A166788679281210680; guest_id_ads=v1%3A166788679281210680; guest_id_marketing=v1%3A166788679281210680; personalization_id="v1_jI/DQdl3p4DFnXXBgqlcrQ=="'
    }
  };
    
  axios(postConfig)
    .then(function (response) {
      req.infos = response.data;
      next();
    })
    .catch(function () {
      res.render('index', { error: 1, errmsg: 'Invalid id. Please input valid id.' });
    });
}

let parsertwo = (req, res, next) => {
  let authorConfig = {
    method: 'get',
    url: `https://api.twitter.com/2/users/${req.infos.data.author_id}?user.fields=profile_image_url,url,verified,location,description`,
    headers: { 
      'Authorization': `Bearer ${BEARER}`, 
      'Cookie': 'guest_id=v1%3A166788679281210680; guest_id_ads=v1%3A166788679281210680; guest_id_marketing=v1%3A166788679281210680; personalization_id="v1_jI/DQdl3p4DFnXXBgqlcrQ=="'
    }
  };

  axios(authorConfig)
    .then(function (resp){
      req.auth = resp.data;
      next();
    })
    .catch(function (err){
      console.log(err);
    })
}

app.post('/search', parser, parsertwo, (req, res) => {
  const receivedData = req.infos;
  const receivedAuthor = req.auth;
  const date = new Date().getTime();
  
  fs.mkdirSync(`./output/individual/${date}`, err => {
    if (err) console.log(err);
    return;
  })

  fs.writeFileSync(`./output/individual/${date}/${date}.txt`, `JSON:\n{"creation": "${date}", "info": {"detail": ${JSON.stringify(receivedData)},"image": ${JSON.stringify(receivedAuthor)}}}\n\nAuthor:\n${receivedAuthor.data.name}\n\nUsername:\n${receivedAuthor.data.username}\n\nText:\n${receivedData.data.text}\n\nPost Created:\n${receivedData.data.created_at}`, err => {
    if (err) console.log(err);
    return;
  })

  fs.appendFileSync(`./output/retrieved.txt`, `{"creation": "${new Date().getTime()}", "info": {"detail": ${JSON.stringify(receivedData)},"image": ${JSON.stringify(receivedAuthor)}}},\n`, err => {
    if (err) console.log(err);
    return;
  })

  res.render('response', { receivedData, receivedAuthor });
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}`));