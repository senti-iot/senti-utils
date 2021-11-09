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
								\`long\`=?
								where uuid=?`

router.get('/gen-lat-long', async (req, res) => {
	let installations = await mysqlConn.query(getInstallationsQuery).then(rs => rs[0])
	let editInst = async i => {
		if (!i.lat && !i.long) {
			if (i.address) {
				// let dawaData = await dawaApi.get(`adresser?vejnavn=${address[0]}&husnr=${address[1]}&struktur=mini`).then(rs => {
				let dawaData = await dawaApi.get(`adresser?q=${i.address}, 4750`).then(rs => {

					return rs

				})

				// console.log('Data', dawaData[0])
				if (!dawaData.ok) {
					return {
						instUUID: i.uuid,
						address: i.address,
						ok: dawaData.ok,
						data: dawaData.data
					}
				}
				if (dawaData.ok && dawaData.data[0]) {
					let dawaAddr = dawaData[0]
					if (dawaAddr.x && dawaAddr.y) { //lat is y and long is x
						await setTimeout(async () => {
							let updateI = await mysqlConn.query(updateInstallationsQuery, [dawaAddr.y, dawaAddr.x, i.uuid])
							console.log(updateI[0])
							return true
						}, 200)
					}
					else return false
				}
				else return false
			}
			else {
				return {
					instUUID: i.uuid,
					address: i.address
				}
			}
		}
	}
	await Promise.all(installations.map(i => {
		return editInst(i)
	})).then(rs => res.status(200).json(rs.filter(x => !!x)))

})

module.exports = router