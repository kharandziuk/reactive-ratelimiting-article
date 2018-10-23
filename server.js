var debug = require('debug')('app')

const express = require('express')
const app = express()
const port = 3000

app.post('/people', (req, res) => {
  debug('call')
  res.status(201).json({status: 'created'})
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
