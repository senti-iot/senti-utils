const express = require('express')
const authRouter = express.Router()
const { authClient } = require('../../server')

authRouter.all('*', async (req, res, next) => {

	let lease = await authClient.getLease(req)
	let bearerToken = await authClient.parseBearerToken(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	console.log('Authenticated')
	req.bearer = bearerToken
	req.lease = lease
	next()
})


module.exports = authRouter