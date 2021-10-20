const { create } = require('apisauce')
const express = require('express')
const router = express.Router()
const mysqlConn = require('../../lib/mysqlConn')

const dawaApi = create({
	baseURL: `https://dawa.aws.dk`,
	timeout: 30000,
	header: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
})

let getInstallationsQuery = `SELECT * from installation`
let updateInstallationsQuery = `UPDATE installation
								SET
								lat=?,
								long=?
								where uuid=?`;

router.get('/gen-lat-long', async (req, res) => {
	let installations = await mysqlConn.query(getInstallationsQuery).then(rs => rs[0])
	let editInst = async i => {
		if (i.address) {
			let address = i.address.split(' ')
			console.log('Address')
			console.log(address)
			let dawaData = await dawaApi.get(`adresser?vejnavn=${address[0]}&husnr=${address[1]}&struktur=mini`)
			if (dawaData[0]) {
				let dawaAddr = dawaData[0]
				if (dawaAddr.x && dawaAddr.y) { //lat is y and long is x
					let updateI = await mysqlConn.query(updateInstallationsQuery, [dawaAddr.y, dawaAddr.x, i.uuid])
					if (updateI[0].affectedRows > 1) {
						return true
					}
					else {
						return false
					}
				}
			}
		}
		else {
			return true
		}
	}
	let result = await Promise.all(installations.map(i => editInst(i)))
	res.status(200).json(result)

})

module.exports = router