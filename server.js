#!/usr/bin/env nodejs
process.title = "senti_service"
const dotenv = require('dotenv').config()
if (dotenv.error) {
	console.warn(dotenv.error)
}
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const app = express()


// ACL Client

const sentiAuthClient = require('senti-apicore').sentiAuthClient
const authClient = new sentiAuthClient(process.env.AUTHCLIENTURL, process.env.PASSWORDSALT)
module.exports.authClient = authClient

const sentiAclBackend = require('senti-apicore').sentiAclBackend
const sentiAclClient = require('senti-apicore').sentiAclClient

const aclBackend = new sentiAclBackend(process.env.ACLBACKENDTURL)
const aclClient = new sentiAclClient(aclBackend)
module.exports.aclClient = aclClient

// API Request Parsers

const port = process.env.NODE_PORT || 3007

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors())

// API Endpoints

const auth = require('./api/auth/auth')
const genLatLongInstallations = require('./api/scripts/genLatLongInstallations')

app.use([genLatLongInstallations])
app.use([auth])



//---Start the express server---------------------------------------------------

var printRoutes = require('./lib/printRoutes')

const startServer = () => {
	console.clear()
	printRoutes(app)
	app.listen(port, () => {
		console.log('Senti Service started on port', port)
	}).on('error', (err) => {
		if (err.errno === 'EADDRINUSE') {
			console.log('Service not started, port ' + port + ' is busy')
		} else {
			console.log(err)
		}
	})
}

startServer()
