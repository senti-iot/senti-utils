const { create } = require('apisauce')
const express = require('express')
const router = express.Router()
const mysqlConn = require('../../lib/mysqlConn')

const dawaApi = create({
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
								\`long\`=?
								where uuid=?`

router.get('/gen-lat-long', async (req, res) => {
	let installations = await mysqlConn.query(getInstallationsQuery).then(rs => rs[0])
	let editInst = async i => {
		if (!i.lat && !i.long) {
			if (i.address && i.address.length > 0) {
				// let dawaData = await dawaApi.get(`adresser?vejnavn=${address[0]}&husnr=${address[1]}&struktur=mini`).then(rs => {
				let dawaData = await dawaApi.get(`https://dawa.aws.dk/adresser?q=${encodeURIComponent(i.address + ', 4750 Lundby')}&struktur=mini`).then(rs => {
					return rs.data

				})
				console.log('Address:', i.address)
				console.log('Data', dawaData)
				if (dawaData && dawaData.length > 0) {
					let dawaAddr = dawaData[0]
					console.log('DawaAddr', dawaAddr)
					if (dawaAddr.x && dawaAddr.y) { //lat is y and long is x
						let updateI = await mysqlConn.query(updateInstallationsQuery, [dawaAddr.y, dawaAddr.x, i.uuid])
						console.log(updateI[0])
						return true

					}
					else return false
				}
				else return false
			}
			else
				return false
		}
	}
	// let rs = []
	// let result = await editInst(installations[1018])
	// for (installation in installations) {
	// 	// console.log(installation)
	// 	let result = await editInst(installations[installation])
	// 	console.log(result)
	// 	rs.push(result)
	// }
	// res.status(200).json(rs)
	console.log('Processing')
	await Promise.all(installations.map(async i => {
		return await editInst(i)
	})).then(rs => res.status(200).json(rs.filter(x => !!x)))

})

module.exports = router