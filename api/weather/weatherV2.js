const create = require('apisauce').create;
const express = require('express');
const router = express.Router();
const moment = require('moment');
const { parse } = require('json2csv');

const { WEATHER_APIV2 } = process.env;

const api = create({
	baseURL: 'https://dmigw.govcloud.dk',
	timeout: 30000,
	headers: {
		'X-Gravitee-Api-Key': WEATHER_APIV2
	}
});

//https://www.geodatasource.com/developers/javascript
function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	} else {
		var radlat1 = Math.PI * lat1 / 180;
		var radlat2 = Math.PI * lat2 / 180;
		var theta = lon1 - lon2;
		var radtheta = Math.PI * theta / 180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180 / Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit == "K") { dist = dist * 1.609344 }
		if (unit == "N") { dist = dist * 0.8684 }
		return dist;
	}
}

const getWeatherData = async (from, to, lat, long, parameterId) => {
	let result = [];

	const fs = require("fs");

	let stations = fs.readFileSync('lib/weather-stations.json').toString();
	stations = JSON.parse(stations);

	let nearest = null;
	stations.map(station => {
		const dist = distance(station.lat, station.long, lat, long, "K");

		if (!nearest) {
			nearest = {};
			nearest.dist = dist;
			nearest.station = station;
		} else {
			if (dist < nearest.dist) {
				nearest.dist = dist;
				nearest.station = station;
			}
		}
	});

	if (nearest) {
		let type = '';
		if (parameterId === 'temperature') {
			type = 'temp_mean_past1h';
		} else if (parameterId === 'humidity') {
			type = 'humidity_past1h';
		} else if (parameterId === 'wind') {
			type = 'wind_dir_past1h';
		} else if (parameterId === 'visibility') {
			type = 'visib_mean_last10min';
		} else if (parameterId === 'weather') {
			type = 'weather';
		}

		from = moment(from).format('YYYY-MM-DDTHH:mm:ss[Z]');
		to = moment(to).format('YYYY-MM-DDTHH:mm:ss[Z]');

		// console.log('nearest station: ', nearest.station.name, nearest.station.stationId, nearest.station.lat, nearest.station.long);

		const data = await api.get('/v2/metObs/collections/observation/items?stationId=' + nearest.station.stationId + '&datetime=' + from + '/' + to + '&parameterId=' + type).then(rs => rs.data);

		if (data) {
			data.features.map(d => {
				result.push({ date: d.properties.observed, value: d.properties.value });
			});
		}
	}

	return result;
}

router.get('/weather/v2/export/:from/:to/:lat/:long', async (req, res) => {
	const resultTemperature = await getWeatherData(req.params.from, req.params.to, req.params.lat, req.params.long, 'temperature');
	const resultHumidity = await getWeatherData(req.params.from, req.params.to, req.params.lat, req.params.long, 'humidity');
	// console.log(resultTemperature);

	let result = [];
	resultTemperature.map((d, i) => {
		let humidity = resultHumidity.filter(h => h.date === d.date);

		result.push({
			date: d.date,
			temperature: d.value.toString().replace('.', ','),
			humidity: humidity !== undefined ? humidity[0].value : ''
		});
	});

	const fields = ['date', 'temperature', 'humidity'];

	try {
		const csv = parse(result, { fields });

		res.status(200).send(csv);
	} catch (err) {
		res.status(404).json(err);
	}
});

router.get('/weather/v2/:from/:to/:lat/:long/:parameterId', async (req, res) => {
	const result = await getWeatherData(req.params.from, req.params.to, req.params.lat, req.params.long, req.params.parameterId);

	res.json(result);
});

router.get('/weather/v2/stations', async (req, res) => {
	const data = await api.get('/v2/metObs/collections/station/items?status=Active&datetime=' + moment().format('YYYY-MM-DD') + 'T00:00:00Z/..').then(rs => rs.data);

	let result = [];

	if (data) {
		data.features.map(d => {
			if (d.properties.parameterId.includes('temp_dry') ||
				d.properties.parameterId.includes('humidity') ||
				d.properties.parameterId.includes('wind_dir') ||
				d.properties.parameterId.includes('visibility') ||
				d.properties.parameterId.includes('weather')) {

				result.push({
					stationId: d.properties.stationId,
					name: d.properties.name,
					lat: d.geometry.coordinates[1],
					long: d.geometry.coordinates[0],
				});
			}
		});
	}

	res.json(result);
});

module.exports = router;