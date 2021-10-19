const colorizeMethods = (type) => {
	switch (type) {
		case 'get':
			return 'GET'.green
		case 'post':
			return 'POST'.yellow
		case 'put':
			return 'PUT'.blue
		case 'delete':
			return 'DELETE'.red
		case 'all':
			return 'ALL'.blue
		default:
			return type
	}
}

module.exports = function (app) {
	var Table = require('cli-table3')
	var table = new Table()
	console.log('\n********************************************')
	console.log('\n****************  API  *********************')
	let routes = []
	app._router.stack.forEach(function (middleware) {
		if (middleware.route) { // routes registered directly on the app
			routes.push(middleware.route)
			// console.log(middleware.route)
		} else if (middleware.name === 'router') { // router middleware
			middleware.handle.stack.forEach(function (handler) {
				let route = handler.route
				let type = route.stack ? route.stack[0].method : ""
				if (!type) {
					type = 'all'
				}
				route && table.push([type ? colorizeMethods(type.toUpperCase()) : '', route.path.toString()])
			})
		}
	})
	console.log(table.toString())
	return table
}