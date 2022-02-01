const create = require('apisauce').create
const express = require('express')
const router = express.Router()

const { WEATHER_API } = process.env
const weatherRoute = '/weather/:date/:lat/:long/:lang'

const api = create({
	baseURL: `https://api.darksky.net/forecast/${WEATHER_API}/`,
	timeout: 30000
})


// DarkSky weather API proxy
const getWeather = async (date, lat, long, lang) => {
	let response
	try {
		response = await api.get(`${lat},${long},${date}?lang=${lang}&exclude=alerts,flags,hourly&units=si&extend=daily`)
	} catch (error) {
		response = await getWeather(date, lat, long, lang)
	}
	// check response
	if (response.ok && response.status == 200) {
		console.log('API/weather:', response.status, Date())
		return response.data
	} else {
		console.log('API/weather Error:', response.problem, Date())
		return 403
	}
}

router.get(weatherRoute, async (req, res) => {

	let response
	response = await getWeather(req.params.date, req.params.lat, req.params.long, req.params.lang)
	res.json(response)

})

module.exports = router
